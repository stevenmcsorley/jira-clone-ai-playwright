#!/usr/bin/env node
/**
 * Ossicone MCP server — stdio transport.
 *
 * Exposes the Ossicone project tracker (projects, issues, sprints, reports)
 * as MCP tools so an AI agent can plan projects and track work Jira-style.
 * For local clients that spawn the server as a subprocess (Claude Desktop/Code
 * with a filesystem path). For a zero-install "just add a URL" connection, use
 * the hosted HTTP transport (http.js) instead.
 *
 * Env:
 *   OSSICONE_URL           Base URL of the Ossicone backend (default http://localhost:4000)
 *   OSSICONE_API_TOKEN     API token created in Ossicone (POST /api/tokens) — required
 *   OSSICONE_WORKSPACE_ID  Optional workspace override. Tokens created since the
 *                          workspaces release are bound server-side and ignore this;
 *                          it only affects legacy unbound tokens.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { makeApi, buildServer } from './tools.js'

const BASE_URL = (process.env.OSSICONE_URL || 'http://localhost:4000').replace(/\/$/, '')
const API_TOKEN = process.env.OSSICONE_API_TOKEN

if (!API_TOKEN) {
  console.error('OSSICONE_API_TOKEN is required (create one in Ossicone: POST /api/tokens)')
  process.exit(1)
}

const server = buildServer(makeApi(BASE_URL, API_TOKEN, process.env.OSSICONE_WORKSPACE_ID))
const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`Ossicone MCP server connected (${BASE_URL})`)
