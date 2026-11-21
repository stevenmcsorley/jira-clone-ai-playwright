import test from 'node:test'
import assert from 'node:assert/strict'
import { collectTools, callTool } from '../codemode.js'
import { formatElapsed, slimTimer } from '../tools.js'

const record = (replies = {}) => {
  const calls = []
  const api = async (path, opts = {}) => {
    calls.push({ method: opts.method ?? 'GET', path, body: opts.body })
    return replies[`${opts.method ?? 'GET'} ${path}`] ?? {}
  }
  return { calls, tools: collectTools(api) }
}
const text = (result) => result

test('every timer action an agent might need is a tool', () => {
  const { tools } = record()
  for (const name of ['list_timers', 'get_timer', 'start_timer', 'pause_timer', 'resume_timer', 'stop_timer', 'discard_timer', 'stop_all_timers']) {
    assert.ok(tools.has(name), `missing ${name}`)
  }
})

test('formatElapsed reads at a glance', () => {
  assert.equal(formatElapsed(0), '0m 00s')
  assert.equal(formatElapsed(65_000), '1m 05s')
  assert.equal(formatElapsed(4_320_000), '1h 12m 00s')
})

test('slimTimer keeps the key, title, state and elapsed, and a stop reports what was logged', () => {
  const t = slimTimer({ issueId: 7, status: 'stopped', elapsedMs: 3_600_000, loggedHours: 1, issue: { title: 'Fix it', projectKey: 'OSS' } })
  assert.deepEqual(t, { issueId: 7, key: 'OSS-7', title: 'Fix it', status: 'stopped', elapsed: '1h 00m 00s', elapsedMs: 3_600_000, loggedHours: 1 })
})

test('start, pause, resume and stop call the timer API for the right issue', async () => {
  const stopped = { issueId: 7, status: 'stopped', elapsedMs: 1_800_000, loggedHours: 0.5 }
  const { calls, tools } = record({ 'POST /timers/issue/7/stop': stopped })
  await callTool(tools, 'start_timer', { issueId: 7 })
  await callTool(tools, 'pause_timer', { issueId: 7 })
  await callTool(tools, 'resume_timer', { issueId: 7 })
  const result = text(await callTool(tools, 'stop_timer', { issueId: 7, description: 'Done reviewing' }))
  assert.deepEqual(calls.map(c => `${c.method} ${c.path}`), ['POST /timers/issue/7/start', 'POST /timers/issue/7/pause', 'POST /timers/issue/7/resume', 'POST /timers/issue/7/stop'])
  assert.deepEqual(calls[3].body, { description: 'Done reviewing', log: undefined })
  assert.equal(result.loggedHours, 0.5)
})

test('discard_timer stops without logging, and stop_all_timers stops everything', async () => {
  const { calls, tools } = record({ 'POST /timers/stop-all': [{ issueId: 1, status: 'stopped', elapsedMs: 0 }, { issueId: 2, status: 'stopped', elapsedMs: 0 }] })
  await callTool(tools, 'discard_timer', { issueId: 9 })
  const all = text(await callTool(tools, 'stop_all_timers', {}))
  assert.deepEqual(calls[0].body, { log: false })
  assert.equal(calls[1].path, '/timers/stop-all')
  assert.equal(all.length, 2)
})

test('list_timers returns trimmed timers', async () => {
  const { tools } = record({ 'GET /timers': [{ issueId: 3, status: 'running', elapsedMs: 90_000, issue: { title: 'Ship', projectKey: 'BIL' } }] })
  const [first] = text(await callTool(tools, 'list_timers', {}))
  assert.deepEqual([first.key, first.status, first.elapsed], ['BIL-3', 'running', '1m 30s'])
})
