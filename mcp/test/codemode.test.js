import test from 'node:test'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { buildServer } from '../tools.js'
import { buildCodeModeServer, collectTools, searchCatalog, callTool, runSandboxed } from '../codemode.js'

const fakeApi = (log = []) => async (path, opts = {}) => {
  log.push(`${opts.method ?? 'GET'} ${path}`)
  if (path === '/projects') return [{ id: 1, name: 'Alpha', key: 'ALP' }, { id: 2, name: 'Beta', key: 'BET' }]
  if (path.startsWith('/issues')) return [{ id: 7, title: 't', status: 'done', type: 'task', priority: 'low', labels: [] }, { id: 8, title: 'u', status: 'todo', type: 'bug', priority: 'high', labels: [] }]
  return {}
}
const fnsFor = (tools) => Object.fromEntries([...tools.keys()].map((n) => [n, (a) => callTool(tools, n, a)]))

test('collects every tool the normal server registers', async () => {
  const names = []; buildServer.length // sanity: exported
  const tools = collectTools(fakeApi())
  const c = new Client({ name: 't', version: '1' }); const [a, b] = InMemoryTransport.createLinkedPair()
  await buildServer(fakeApi()).connect(a); await c.connect(b)
  const normal = (await c.listTools()).tools.map((t) => t.name).sort()
  assert.deepEqual([...tools.keys()].sort(), normal)
  await c.close()
})

test('search: empty query is a names-only index; query returns schemas', () => {
  const tools = collectTools(fakeApi())
  const idx = searchCatalog(tools, '')
  assert.equal(idx.length, tools.size); assert.ok(idx.every((i) => i.method.startsWith('ossicone.') && !('inputSchema' in i)))
  const hit = searchCatalog(tools, 'list_issues', 1)
  assert.equal(hit[0].method, 'ossicone.list_issues'); assert.ok(hit[0].inputSchema.properties.projectId)
  assert.deepEqual(searchCatalog(tools, 'zzz_nothing'), [])
})

test('execute: chains calls, aggregates in code, returns only the small result', async () => {
  const log = []; const tools = collectTools(fakeApi(log))
  const out = await runSandboxed(`async () => {
    const ps = await ossicone.list_projects({}); const r = [];
    for (const p of ps) { const is = await ossicone.list_issues({ projectId: p.id }); r.push({ k: p.key, done: is.filter(i => i.status === 'done').length }) }
    console.log('checked', ps.length); return r }`, fnsFor(tools))
  assert.deepEqual(out.result, [{ k: 'ALP', done: 1 }, { k: 'BET', done: 1 }]); assert.equal(out.calls, 3); assert.deepEqual(out.logs, ['checked 2'])
})

test('execute: tolerates bare statements and fenced code', async () => {
  const tools = collectTools(fakeApi())
  assert.equal((await runSandboxed('return 1 + 1', fnsFor(tools))).result, 2)
  assert.equal((await runSandboxed('```js\nasync () => 5\n```', fnsFor(tools))).result, 5)
})

test('sandbox has no network, fs, process, require, import or timers to escape with', async () => {
  const tools = collectTools(fakeApi())
  const probe = async (expr) => (await runSandboxed(`async () => (${expr})`, fnsFor(tools))).result
  for (const g of ['fetch', 'process', 'require', 'XMLHttpRequest', 'WebSocket', 'Buffer', 'setTimeout', 'globalThis.constructor.constructor']) {
    assert.equal(await probe(`typeof ${g}`), g.includes('constructor') ? 'function' : 'undefined', g)
  }
  const out = await runSandboxed(`async () => { const F = (async()=>{}).constructor; return await new F('return typeof process + typeof require + typeof fetch')() }`, fnsFor(tools))
  assert.equal(out.result, 'undefinedundefinedundefined') // even Function-constructor tricks see an empty world
  assert.match((await runSandboxed(`async () => await import('node:fs')`, fnsFor(tools))).error ?? '', /./)
})

test('limits: call cap, runaway sync loop, memory bomb', async () => {
  const tools = collectTools(fakeApi())
  const capped = await runSandboxed(`async () => { for (let i = 0; i < 100; i++) await ossicone.list_projects({}); return 'done' }`, fnsFor(tools), { maxCalls: 5 })
  assert.match(capped.error, /exceeded 5/)
  const t0 = Date.now()
  const loop = await runSandboxed('async () => { while (true) {} }', fnsFor(tools), { timeoutMs: 300 })
  assert.ok(loop.error && Date.now() - t0 < 3000, `loop must be interrupted, got ${loop.error}`)
  const mem = await runSandboxed('async () => { const a = []; for (;;) a.push(new Array(100000).fill(1)) }', fnsFor(tools), { memoryBytes: 8 * 1024 * 1024, timeoutMs: 5000 })
  assert.ok(mem.error, 'memory bomb must error, not crash the host')
})

test('tool errors abort the script with the upstream message (no plausible-looking partial data)', async () => {
  const api = async () => { throw new Error('Ossicone API error on GET /projects: 403 forbidden') }
  const out = await runSandboxed('async () => await ossicone.list_projects({})', fnsFor(collectTools(api)))
  assert.match(out.error, /403 forbidden/)
})

test('arguments are validated by the tool schema before any API call', async () => {
  const log = []; const tools = collectTools(fakeApi(log))
  const out = await runSandboxed('async () => await ossicone.list_issues({ projectId: "not-a-number" })', fnsFor(tools))
  assert.ok(out.error); assert.deepEqual(log, [])
})

test('end to end over MCP: exactly two tools, search + execute work, errors flagged', async () => {
  const c = new Client({ name: 't', version: '1' }); const [a, b] = InMemoryTransport.createLinkedPair()
  await buildCodeModeServer(fakeApi()).connect(a); await c.connect(b)
  assert.deepEqual((await c.listTools()).tools.map((t) => t.name).sort(), ['execute', 'search'])
  const s = JSON.parse((await c.callTool({ name: 'search', arguments: {} })).content[0].text); assert.equal(s.totalTools, 34)
  const ok = await c.callTool({ name: 'execute', arguments: { code: 'async () => (await ossicone.list_projects({})).length' } })
  assert.equal(JSON.parse(ok.content[0].text).result, 2)
  const bad = await c.callTool({ name: 'execute', arguments: { code: 'async () => { throw new Error("boom") }' } })
  assert.equal(bad.isError, true); assert.match(bad.content[0].text, /boom/)
  await c.close()
})
