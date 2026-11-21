const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/pages/Today/today.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {}, require: () => ({}) }
vm.runInNewContext(compiled, context)
const { buildToday, summariseSprint } = context.exports

const issue = (id, over = {}) => ({ id, title: `Issue ${id}`, status: 'todo', priority: 'medium', type: 'task', projectId: 1, reporterId: 1, labels: [], assigneeId: 1, ...over })

test('Today lists what is mine and started, what waits for review, what Skylark opened and what is next', () => {
  const issues = [
    issue(1, { status: 'in_progress' }),
    issue(2, { status: 'in_progress', assigneeId: 2 }),
    issue(3, { status: 'code_review', assigneeId: 2 }),
    issue(4, { labels: ['skylark', 'error'], assigneeId: null }),
    issue(5, { priority: 'urgent' }),
    issue(6, { priority: 'low' }),
    issue(7, { status: 'done' }),
    issue(8, { status: 'done', labels: ['skylark'] }),
  ]
  const t = buildToday(issues, 1)
  assert.deepEqual(Array.from(t.inProgress, i => i.id), [1])
  assert.deepEqual(Array.from(t.inReview, i => i.id), [3])
  assert.deepEqual(Array.from(t.fromSkylark, i => i.id), [4])
  assert.deepEqual(Array.from(t.upNext, i => i.id), [5, 6, 4].filter(id => id !== 4), 'most urgent first; unassigned work is not mine')
})

test('Today never invents work for a signed-out user', () => {
  const t = buildToday([issue(1, { status: 'in_progress' })], undefined)
  assert.equal(t.inProgress.length, 0)
  assert.equal(t.upNext.length, 0)
})

test('a sprint summary counts only its own issues and counts days left', () => {
  const now = Date.parse('2026-11-21T00:00:00Z')
  const sprint = { id: 9, name: 'Sprint 9', status: 'active', endDate: '2026-11-24T00:00:00Z' }
  const s = summariseSprint({ id: 1, key: 'OSS', name: 'Ossicone' }, sprint, [issue(1, { sprintId: 9, status: 'done' }), issue(2, { sprintId: 9 }), issue(3, { sprintId: 4 })], now)
  assert.equal(s.total, 2); assert.equal(s.done, 1); assert.equal(s.daysLeft, 3)
})
