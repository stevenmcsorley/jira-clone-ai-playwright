const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const { randomUUID } = require('node:crypto')
const { Client } = require('pg')
const bcrypt = require('bcrypt')
const path = require('node:path')

// This suite resets only its dedicated, explicitly named local database.
const database = process.env.TEST_DATABASE_URL
if (!database) throw new Error('Set TEST_DATABASE_URL to the dedicated local ossicone_oauth_test database')
const address = new URL(database)
assert.ok(['localhost', '127.0.0.1'].includes(address.hostname) && address.pathname === '/ossicone_oauth_test', 'Refusing to reset any other database')
process.env.DATABASE_URL = database
process.env.NODE_ENV = 'test'
process.env.TYPEORM_MIGRATIONS = 'true'
process.env.TYPEORM_SYNC = 'false'
process.env.JWT_SECRET = randomUUID()
process.env.FRONTEND_URL = 'http://127.0.0.1:4011'
const { NestFactory } = require('@nestjs/core')
const { ValidationPipe } = require('@nestjs/common')
const { DataSource } = require('typeorm')
const { AppModule } = require('../dist/app.module')
const { challenge, validRedirect } = require('../dist/auth/services/oauth.service')
const { oauthApiAllowed } = require('../dist/auth/guards/oauth.guard')
let app, db, base, mcp, session, otherSession, workspace, otherWorkspace, user, project, client
const redirect = 'https://chatgpt.com/connector/oauth/callback'
const verifier = 'a'.repeat(64)

async function call(route, { method = 'GET', body, token, headers = {}, form = false } = {}) {
  const response = await fetch(base + route, { method, redirect: 'manual',
    headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' } : {}) },
    body: body ? (form ? new URLSearchParams(body).toString() : JSON.stringify(body)) : undefined })
  const text = await response.text()
  let data; try { data = JSON.parse(text) } catch { data = text }
  return { response, data, status: response.status }
}
async function authorization(options = {}) {
  const params = { client_id: client.client_id, redirect_uri: redirect, response_type: 'code',
    code_challenge: challenge(verifier), code_challenge_method: 'S256',
    state: 'test-state', resource: process.env.FRONTEND_URL + '/mcp', scope: 'mcp offline_access', ...options }
  const result = await call('/oauth/authorize?' + new URLSearchParams(params))
  const location = result.response.headers.get('location')
  return { ...result, url: location ? new URL(location) : null }
}
async function code(access = 'write') {
  const start = await authorization()
  assert.equal(start.status, 302)
  const request = start.url.searchParams.get('request')
  assert.ok(request)
  assert.equal((await call('/api/oauth/request?request=' + request, { token: session })).status, 200)
  const result = await call('/api/oauth/consent', { method: 'POST', token: session,
    body: { request, workspaceId: workspace, access, decision: 'allow' } })
  assert.equal(result.status, 200)
  const url = new URL(result.data.redirect)
  assert.equal(url.searchParams.get('state'), 'test-state')
  assert.equal(url.searchParams.get('iss'), process.env.FRONTEND_URL)
  return url.searchParams.get('code')
}
async function exchange(value, options = {}) {
  return call('/oauth/token', { method: 'POST', form: true, body: {
    grant_type: 'authorization_code', client_id: client.client_id, code: value,
    redirect_uri: redirect, code_verifier: verifier, resource: process.env.FRONTEND_URL + '/mcp', ...options } })
}
async function refresh(token, options = {}) {
  return call('/oauth/token', { method: 'POST', form: true, body: {
    grant_type: 'refresh_token', client_id: client.client_id, refresh_token: token, ...options } })
}
async function rpc(token, method, params, id = 1) {
  const response = await fetch(process.env.FRONTEND_URL + '/mcp', { method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) })
  const text = await response.text()
  const payload = text.startsWith('event:') ? JSON.parse(text.split('\n').find(l => l.startsWith('data:')).slice(5)) : JSON.parse(text)
  return { response, payload }
}

before(async () => {
  const reset = new Client({ connectionString: database }); await reset.connect()
  await reset.query('DROP SCHEMA public CASCADE'); await reset.query('CREATE SCHEMA public'); await reset.end()
  app = await NestFactory.create(AppModule, { logger: false })
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(0, '127.0.0.1')
  base = await app.getUrl()
  db = app.get(DataSource)
  const password = await bcrypt.hash('test-password', 4)
  for (const [email, name] of [['owner@example.test', 'Owner'], ['other@example.test', 'Other']])
    await db.query('INSERT INTO users(email,name,password,role) VALUES($1,$2,$3,$4)', [email, name, password, 'admin'])
  const users = await db.query('SELECT id FROM users ORDER BY id'); user = users[0].id
  const workspaces = await db.query(`INSERT INTO workspaces(name) VALUES('One'),('Two') RETURNING id`)
  workspace = workspaces[0].id; otherWorkspace = workspaces[1].id
  await db.query(`INSERT INTO workspace_members("workspaceId","userId",role) VALUES($1,$2,'owner'),($3,$4,'owner')`,
    [workspace, user, otherWorkspace, users[1].id])
  project = (await db.query(`INSERT INTO projects(name,key,"leadId","workspaceId") VALUES('Private','PRIVATE',$1,$2) RETURNING id`, [users[1].id, otherWorkspace]))[0].id
  session = (await call('/api/auth/login', { method: 'POST', body: { email: 'owner@example.test', password: 'test-password' } })).data.token
  otherSession = (await call('/api/auth/login', { method: 'POST', body: { email: 'other@example.test', password: 'test-password' } })).data.token
  assert.ok(session && otherSession)
  client = (await call('/oauth/register', { method: 'POST', body: { client_name: 'ChatGPT', redirect_uris: [redirect] } })).data
  mcp = spawn(process.execPath, ['http.js'], { cwd: path.resolve(__dirname, '../../mcp'),
    env: { ...process.env, PORT: '4011', OSSICONE_URL: base, PUBLIC_URL: process.env.FRONTEND_URL }, stdio: 'pipe' })
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(process.env.FRONTEND_URL + '/health')).ok) return } catch {}
    await new Promise(r => setTimeout(r, 100))
  }
  throw new Error('MCP test server did not start')
})
after(async () => { if (mcp) mcp.kill(); if (app) await app.close() })

test('metadata advertises discovery, PKCE, public DCR and refresh', async () => {
  const metadata = (await call('/.well-known/oauth-authorization-server')).data
  assert.deepEqual(metadata.code_challenge_methods_supported, ['S256'])
  assert.deepEqual(metadata.token_endpoint_auth_methods_supported, ['none'])
  assert.ok(metadata.scopes_supported.includes('offline_access'))
  const resource = (await call('/.well-known/oauth-protected-resource/mcp')).data
  assert.equal(resource.resource, process.env.FRONTEND_URL + '/mcp')
  assert.deepEqual(resource.authorization_servers, [metadata.issuer])
})
test('registration rejects unsafe redirects and unsupported client auth', async () => {
  for (const uri of ['javascript:alert(1)', 'https://user:pass@evil.test/callback', 'https://example.test/#fragment', 'http://example.test/callback']) assert.equal(validRedirect(uri), false)
  assert.equal(validRedirect('http://127.0.0.1/callback'), true)
  assert.equal((await call('/oauth/register', { method: 'POST', body: { redirect_uris: [redirect], token_endpoint_auth_method: 'client_secret_basic' } })).status, 400)
})
test('authorization refuses unregistered redirects without redirecting', async () => {
  assert.equal((await authorization({ redirect_uri: 'https://evil.test/callback' })).status, 400)
})
test('authorization rejects plain PKCE, wrong resource and unsupported scope', async () => {
  for (const [override, expected] of [[{ code_challenge_method: 'plain' }, 'invalid_request'], [{ resource: 'https://evil.test/mcp' }, 'invalid_target'], [{ scope: 'mcp admin' }, 'invalid_scope']]) {
    const result = await authorization(override)
    assert.equal(result.url.searchParams.get('error'), expected)
    assert.equal(result.url.searchParams.get('iss'), process.env.FRONTEND_URL)
    assert.equal(result.url.searchParams.get('state'), 'test-state')
  }
})
test('consent requires browser auth, matching session and workspace membership', async () => {
  const request = (await authorization()).url.searchParams.get('request')
  assert.equal((await call('/api/oauth/request?request=' + request)).status, 401)
  assert.equal((await call('/api/oauth/request?request=' + request, { token: session })).status, 200)
  assert.equal((await call('/api/oauth/request?request=' + request, { token: otherSession })).status, 400)
  assert.equal((await call('/api/oauth/consent', { method: 'POST', token: session, body: { request, decision: 'allow', workspaceId: otherWorkspace, access: 'write' } })).status, 403)
  assert.equal((await call('/api/oauth/consent', { method: 'POST', token: session, headers: { Origin: 'https://evil.test' }, body: { request, decision: 'deny' } })).status, 403)
  const deny = await call('/api/oauth/consent', { method: 'POST', token: session, body: { request, decision: 'deny' } })
  assert.equal(new URL(deny.data.redirect).searchParams.get('error'), 'access_denied')
  assert.equal((await call('/api/oauth/request?request=' + request, { token: session })).status, 400)
})
test('PKCE, redirect, resource and client binding; concurrent code exchange is single-use', async () => {
  const value = await code()
  for (const override of [{ code_verifier: 'b'.repeat(64) }, { redirect_uri: 'https://evil.test/callback' }, { resource: 'https://evil.test/mcp' }, { client_id: 'other-client' }]) assert.equal((await exchange(value, override)).status, 400)
  const results = await Promise.all([exchange(value), exchange(value)])
  assert.deepEqual(results.map(r => r.status).sort(), [200, 400])
  const tokens = results.find(r => r.status === 200).data
  assert.ok(tokens.access_token.startsWith('oxo_') && tokens.refresh_token.startsWith('oxr_'))
  const stored = await db.query('SELECT hash FROM mcp_oauth_tokens')
  assert.ok(stored.every(r => r.hash !== tokens.access_token && /^[a-f0-9]{64}$/.test(r.hash)))
})
test('OAuth grants are bound to a workspace, with no admin or credential access', async () => {
  const tokens = (await exchange(await code())).data
  const me = await call('/api/auth/me', { token: tokens.access_token }); assert.equal(me.data.role, 'member')
  const current = await call('/api/workspaces/current', { token: tokens.access_token, headers: { 'X-Workspace-Id': String(otherWorkspace) } })
  assert.equal(current.data.id, workspace)
  assert.equal((await call('/api/projects/' + project, { token: tokens.access_token })).status, 404)
  for (const route of ['/api/tokens', '/api/oauth/connections', '/api/projects/1/repo', '/api/projects/1/webhooks']) assert.equal((await call(route, { token: tokens.access_token })).status, 403)
  assert.equal((await call('/api/users', { token: tokens.access_token, method: 'POST', body: {} })).status, 403)
})
test('read-only denies mutation but permits issue search', async () => {
  const token = (await exchange(await code('read'))).data.access_token
  assert.equal((await call('/api/projects', { token, method: 'POST', body: { name: 'Denied', key: 'DENIED' } })).status, 403)
  assert.equal((await call('/api/projects', { token })).status, 200)
  assert.equal((await call('/api/issues/search', { method: 'POST', token, body: { query: 'test' } })).status, 201)
  assert.equal(oauthApiAllowed('/api/issues/search', 'POST', false), true)
  assert.equal(oauthApiAllowed('/api/projects/1/%72epo', 'GET', true), false)
  assert.equal(oauthApiAllowed('/api/auth/change-password', 'POST', true), false)
})
test('refresh rotation works and replay revokes the entire connection', async () => {
  const tokens = (await exchange(await code())).data
  const rotated = await refresh(tokens.refresh_token); assert.equal(rotated.status, 200)
  assert.notEqual(rotated.data.refresh_token, tokens.refresh_token)
  assert.equal((await call('/api/auth/me', { token: rotated.data.access_token })).status, 200)
  assert.equal((await refresh(tokens.refresh_token)).status, 400)
  assert.equal((await call('/api/auth/me', { token: rotated.data.access_token })).status, 401)
  assert.equal((await refresh(rotated.data.refresh_token)).status, 400)
})
test('expiry, removed membership and user revocation invalidate access', async () => {
  let tokens = (await exchange(await code())).data
  await db.query(`UPDATE mcp_oauth_tokens SET expires_at=now()-interval '1 second' WHERE hash=$1`, [require('../dist/auth/services/oauth.service').hash(tokens.access_token)])
  assert.equal((await call('/api/auth/me', { token: tokens.access_token })).status, 401)
  tokens = (await exchange(await code())).data
  await db.query('DELETE FROM workspace_members WHERE "userId"=$1 AND "workspaceId"=$2', [user, workspace])
  assert.equal((await call('/api/auth/me', { token: tokens.access_token })).status, 401)
  assert.equal((await refresh(tokens.refresh_token)).status, 400)
  await db.query(`INSERT INTO workspace_members("userId","workspaceId",role) VALUES($1,$2,'owner')`, [user, workspace])
  const connections = (await call('/api/oauth/connections', { token: session })).data
  const connection = connections[0]
  await call('/api/oauth/connections/' + connection.id, { method: 'DELETE', token: otherSession })
  assert.equal((await call('/api/auth/me', { token: tokens.access_token })).status, 200)
  await call('/api/oauth/connections/' + connection.id, { method: 'DELETE', token: session })
  assert.equal((await call('/api/auth/me', { token: tokens.access_token })).status, 401)
})
test('MCP challenges invalid credentials and accepts both OAuth and existing API tokens', async () => {
  const invalid = await rpc('invalid', 'tools/list', {})
  assert.equal(invalid.response.status, 401)
  assert.match(invalid.response.headers.get('www-authenticate'), /oauth-protected-resource/)
  const tokens = (await exchange(await code())).data
  const legacy = await call('/api/tokens', { method: 'POST', token: session, body: { name: 'Legacy MCP', scopes: ['read', 'write'] } })
  assert.equal(legacy.status, 201)
  for (const token of [tokens.access_token, legacy.data.token]) {
    const init = await rpc(token, 'initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1' } })
    assert.equal(init.response.status, 200)
    const tools = await rpc(token, 'tools/list', {})
    assert.ok(tools.payload.result.tools.some(t => t.name === 'create_issue'))
    const projects = await rpc(token, 'tools/call', { name: 'list_projects', arguments: {} })
    assert.equal(projects.payload.result.isError, undefined)
    assert.ok(!JSON.parse(projects.payload.result.content[0].text).some(p => p.id === project))
  }
  const created = await rpc(tokens.access_token, 'tools/call', { name: 'create_project', arguments: { name: 'OAuth test', key: 'OAUTH' } })
  assert.equal(created.payload.result.isError, undefined)
  const record = JSON.parse(created.payload.result.content[0].text)
  assert.equal((await call('/api/projects/' + record.id, { token: tokens.access_token })).status, 200)
  const readOnly = (await exchange(await code('read'))).data.access_token
  const denied = await rpc(readOnly, 'tools/call', { name: 'create_project', arguments: { name: 'Denied', key: 'DENIED' } })
  assert.equal(denied.payload.result.isError, true)
  assert.ok(!(await call('/api/projects', { token: tokens.access_token })).data.some(p => p.key === 'DENIED'))
})
