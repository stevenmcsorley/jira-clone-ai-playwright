const { test } = require('node:test')
const assert = require('node:assert/strict')
const { BadRequestException } = require('@nestjs/common')
const { TimersService, elapsedMs, loggableHours } = require('../dist/issues/timers.service')

const HOUR = 3_600_000

/** In-memory stand-ins for the repositories, so the timer rules are tested without a database. */
const setup = () => {
  const rows = []
  let nextId = 1
  const timers = {
    create: (v) => ({ id: undefined, createdAt: new Date(), updatedAt: new Date(), ...v }),
    save: async (v) => { if (!v.id) { v.id = nextId++; rows.push(v) } v.updatedAt = new Date(); return v },
    findOne: async ({ where }) => rows.find(r => r.userId === where.userId && r.issueId === where.issueId) ?? null,
    find: async ({ where }) => rows.filter(r => where.some(w => r.userId === w.userId && r.status === w.status)),
  }
  const issues = { findOne: async ({ where }) => (where.id < 100 ? { id: where.id, title: `Issue ${where.id}`, status: 'todo', projectId: 1, project: { key: 'OSS' } } : null) }
  const logs = []
  const timeTracking = { logTime: async (dto, userId) => { logs.push({ ...dto, userId }) } }
  const emitted = []
  const events = { emitTimersChanged: (userId, issue) => emitted.push([userId, issue.id]) }
  return { service: new TimersService(timers, issues, timeTracking, events), rows, logs, emitted }
}

test('elapsedMs adds the current run to banked time only while running', () => {
  const start = new Date(Date.now() - 90_000)
  assert.ok(elapsedMs({ status: 'running', startedAt: start, accumulatedMs: 10_000 }) >= 100_000)
  assert.equal(elapsedMs({ status: 'paused', startedAt: null, accumulatedMs: 10_000 }), 10_000)
  assert.equal(elapsedMs({ status: 'stopped', startedAt: null, accumulatedMs: 0 }), 0)
})

test('loggableHours rounds to the two decimals the time log stores', () => {
  assert.equal(loggableHours(HOUR), 1)
  assert.equal(loggableHours(1.5 * HOUR), 1.5)
  assert.equal(loggableHours(10_000), 0)
})

test('start creates a running timer and is idempotent', async () => {
  const { service, rows, emitted } = setup()
  assert.equal((await service.start(1, 5)).status, 'running')
  assert.equal((await service.start(1, 5)).status, 'running')
  assert.equal(rows.length, 1)
  assert.equal(emitted.length, 1)
})

test('pause banks the time and resume continues from it', async () => {
  const { service, rows } = setup()
  await service.start(1, 5)
  rows[0].startedAt = new Date(Date.now() - 30 * 60_000)
  const paused = await service.pause(1, 5)
  assert.equal(paused.status, 'paused')
  assert.ok(paused.elapsedMs >= 30 * 60_000)
  assert.equal(rows[0].startedAt, null)
  const resumed = await service.resume(1, 5)
  assert.equal(resumed.status, 'running')
  assert.ok(resumed.elapsedMs >= 30 * 60_000)
})

test('stop logs the time once, resets the timer, and refuses a second stop', async () => {
  const { service, rows, logs } = setup()
  await service.start(1, 5)
  rows[0].startedAt = new Date(Date.now() - 2 * HOUR)
  const stopped = await service.stop(1, 5, { description: 'Reviewed the PR' })
  assert.equal(stopped.loggedHours, 2)
  assert.equal(logs.length, 1)
  assert.deepEqual([logs[0].issueId, logs[0].hours, logs[0].description, logs[0].userId], [5, 2, 'Reviewed the PR', 1])
  assert.deepEqual([rows[0].status, rows[0].accumulatedMs, rows[0].startedAt], ['stopped', 0, null])
  await assert.rejects(service.stop(1, 5), BadRequestException)
  assert.equal(logs.length, 1)
})

test('stop with log=false discards the session', async () => {
  const { service, rows, logs } = setup()
  await service.start(1, 5)
  rows[0].startedAt = new Date(Date.now() - HOUR)
  const stopped = await service.stop(1, 5, { log: false })
  assert.equal(stopped.loggedHours, 0)
  assert.equal(logs.length, 0)
  assert.equal(rows[0].status, 'stopped')
})

test('a session shorter than the log can store is not logged', async () => {
  const { service, logs } = setup()
  await service.start(1, 5)
  assert.equal((await service.stop(1, 5)).loggedHours, 0)
  assert.equal(logs.length, 0)
})

test('pausing or resuming with no timer is an error, not a silent success', async () => {
  const { service } = setup()
  await assert.rejects(service.pause(1, 5), BadRequestException)
  await assert.rejects(service.resume(1, 5), BadRequestException)
})

test("each person's timers are separate and only live ones are listed", async () => {
  const { service } = setup()
  await service.start(1, 5); await service.start(2, 5); await service.start(1, 6)
  await service.stop(1, 6)
  assert.deepEqual((await service.list(1)).map(t => t.issueId), [5])
  assert.deepEqual((await service.list(2)).map(t => t.userId), [2])
})

test('stopAll stops and logs every timer', async () => {
  const { service, rows, logs } = setup()
  await service.start(1, 5); await service.start(1, 6)
  rows.forEach(r => { r.startedAt = new Date(Date.now() - HOUR) })
  assert.equal((await service.stopAll(1)).length, 2)
  assert.equal(logs.length, 2)
  assert.deepEqual(await service.list(1), [])
})

test('status changes follow the board rules: in_progress starts, todo pauses, code_review leaves it, done stops and logs', async () => {
  const { service, rows, logs } = setup()
  await service.applyStatusChange(1, 5, 'todo', 'in_progress')
  assert.equal(rows[0].status, 'running')
  rows[0].startedAt = new Date(Date.now() - HOUR)
  await service.applyStatusChange(1, 5, 'in_progress', 'code_review')
  assert.equal(rows[0].status, 'running')
  await service.applyStatusChange(1, 5, 'code_review', 'todo')
  assert.equal(rows[0].status, 'paused')
  await service.applyStatusChange(1, 5, 'todo', 'in_progress')
  assert.equal(rows[0].status, 'running')
  rows[0].startedAt = new Date(Date.now() - HOUR)
  await service.applyStatusChange(1, 5, 'in_progress', 'done')
  assert.equal(rows[0].status, 'stopped')
  assert.equal(logs.length, 1)
  assert.ok(logs[0].hours >= 2)
})

test('done with no timer logs nothing, and an unchanged status does nothing', async () => {
  const { service, rows, logs } = setup()
  await service.applyStatusChange(1, 5, 'in_progress', 'done')
  await service.applyStatusChange(1, 5, 'todo', 'todo')
  assert.equal(rows.length, 0)
  assert.equal(logs.length, 0)
})

test('importLocal adopts browser timers but never overwrites a live server timer', async () => {
  const { service, rows } = setup()
  await service.start(1, 6)
  const adopted = await service.importLocal(1, [
    { issueId: 5, elapsedMs: 15 * 60_000, status: 'paused' },
    { issueId: 6, elapsedMs: 99 * 60_000, status: 'running' },
    { issueId: 5000, elapsedMs: 1000, status: 'running' },
    { issueId: 5, elapsedMs: -5, status: 'running' },
  ])
  assert.deepEqual(adopted.map(t => t.issueId), [5])
  assert.equal(rows.find(r => r.issueId === 5).accumulatedMs, 15 * 60_000)
  assert.equal(rows.find(r => r.issueId === 6).accumulatedMs, 0)
})
