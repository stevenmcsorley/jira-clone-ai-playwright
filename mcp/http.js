#!/usr/bin/env node
/**
 * Ossicone MCP server — remote Streamable-HTTP transport.
 *
 * The zero-install path: a user adds one URL (https://ossicone.halfagiraf.com/mcp)
 * to their MCP client and pastes their Ossicone API token as a Bearer credential —
 * no clone, no npm install. Runs as the `ossicone-mcp` container behind nginx.
 *
 * Stateless: every POST builds a fresh server + transport and is authed by that
 * request's `Authorization: Bearer <token>` header, so one endpoint safely
 * serves every workspace (the token scopes it, exactly like the stdio server).
 *
 * Env:
 *   OSSICONE_URL   Internal API base (default http://backend:4000)
 *   PORT           Listen port (default 3000)
 */
import express from 'express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { makeApi, buildServer } from './tools.js'

const BASE_URL = (process.env.OSSICONE_URL || 'http://backend:4000').replace(/\/$/, '')
const PORT = Number(process.env.PORT || 3000)

const app = express()
app.use(express.json({ limit: '4mb' }))

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ossicone-mcp', base: BASE_URL }))

const bearer = (req) => {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : null
}
const rpcError = (res, status, message) =>
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32001, message }, id: null })

app.post('/mcp', async (req, res) => {
  const token = bearer(req)
  if (!token) return rpcError(res, 401, 'Missing bearer token — paste your Ossicone API token as the Authorization: Bearer credential.')

  // Stateless: a new server + transport per request (sessionIdGenerator: undefined).
  // No workspaceId on the HTTP path — tokens are workspace-bound server-side.
  const server = buildServer(makeApi(BASE_URL, token))
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  res.on('close', () => { transport.close(); server.close() })
  try {
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (err) {
    console.error('MCP request failed:', err)
    if (!res.headersSent) rpcError(res, 500, 'Internal error')
  }
})

// Stateless mode has no long-lived session, so GET (SSE stream) / DELETE don't apply.
const methodNotAllowed = (_req, res) =>
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed (stateless server).' }, id: null })
app.get('/mcp', methodNotAllowed)
app.delete('/mcp', methodNotAllowed)

app.listen(PORT, () => console.error(`Ossicone MCP (HTTP) listening on :${PORT} → ${BASE_URL}`))
