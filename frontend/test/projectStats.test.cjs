const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/projectStats.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const context = { exports: {} }
vm.runInNewContext(compiled, context)
const { statusCounts, doneRatio, activitySeries, hueFromKey, initials, sparklinePoints, updatedLabel, displayName, formatUpdated, progressSegments } = context.exports

test('empty and missing issues produce zero counts, progress and activity', () => {
  for (const issues of [undefined, []]) {
    assert.deepEqual({ ...statusCounts(issues) }, { todo: 0, in_progress: 0, code_review: 0, done: 0, total: 0 })
    assert.equal(doneRatio(issues), 0)
    assert.deepEqual(Array.from(activitySeries(issues)), Array(14).fill(0))
  }
})

test('counts each known status and includes unknown statuses only in the total', () => {
  const issues = ['todo', 'in_progress', 'code_review', 'done', 'done', 'unknown', 'total'].map(status => ({ status }))
  assert.deepEqual({ ...statusCounts(issues) }, { todo: 1, in_progress: 1, code_review: 1, done: 2, total: 7 })
  assert.equal(doneRatio(issues), 2 / 7)
  assert.equal(doneRatio([{ status: 'done' }]), 1)
})

test('activity buckets use UTC dates, exclude out-of-window dates, and deduplicate each issue per day', () => {
  const now = Date.parse('2026-11-20T14:00:00Z')
  const issues = [
    { createdAt: '2026-11-17T14:00:00Z', updatedAt: new Date('2026-11-18T14:00:00Z') },
    { createdAt: '2026-11-19T23:30:00-01:00', updatedAt: '2026-11-20T08:00:00Z' },
    { createdAt: 'invalid', updatedAt: '2026-11-19T09:00:00Z' },
    { createdAt: '2026-11-19T12:00:00Z', updatedAt: '2026-11-20T12:00:00Z' },
    { updatedAt: '2026-11-21T01:00:00Z' },
  ]
  assert.deepEqual(Array.from(activitySeries(issues, 3, now)), [1, 2, 2])
  assert.deepEqual(Array.from(activitySeries(issues, 0, now)), [])
})

test('project hues are deterministic integers with a fixed missing-key fallback', () => {
  for (const key of ['OPS', 'product', '長いキー']) {
    const hue = hueFromKey(key)
    assert.equal(hueFromKey(key), hue)
    assert.ok(Number.isInteger(hue) && hue >= 0 && hue < 360)
  }
  assert.equal(hueFromKey(), hueFromKey(''))
})

test('initials use the first two words and handle missing names', () => {
  assert.equal(initials('ada'), 'A')
  assert.equal(initials('ada lovelace'), 'AL')
  assert.equal(initials('  ada   byron lovelace  '), 'AB')
  assert.equal(initials('ßeta alpha'), 'SA')
  for (const name of [undefined, '', '   ']) assert.equal(initials(name), '')
})

test('sparkline scales to the peak and returns flat lines for zero and single samples', () => {
  assert.equal(sparklinePoints([], 80, 24), '')
  assert.equal(sparklinePoints([0, 0, 0], 80, 24), '2,22 40,22 78,22')
  assert.equal(sparklinePoints([5], 80, 24), '2,2 78,2')
  assert.equal(sparklinePoints([0, 2, 4], 80, 24), '2,22 40,12 78,2')
  assert.doesNotMatch(sparklinePoints([NaN, Infinity, 4], 80, 24), /NaN/)
})

test('updated labels use the supplied clock and fall back to a local date at one week', () => {
  const date = new Date('2026-11-20T14:00:00Z')
  for (const [elapsed, expected] of [
    [59_999, 'just now'],
    [60_000, '1m ago'],
    [3_600_000, '1h ago'],
    [3 * 86_400_000, '3d ago'],
    [7 * 86_400_000 - 1, '6d ago'],
    [7 * 86_400_000, date.toLocaleDateString()],
    [8 * 86_400_000, date.toLocaleDateString()],
  ]) {
    assert.equal(updatedLabel(date.toISOString(), date.getTime() + elapsed), expected)
  }
  assert.equal(updatedLabel('invalid', date.getTime()), '')
})

test('lead display names preserve names and humanize email local parts', () => {
  assert.equal(displayName({ email: 'smcsorl@sky.com' }), 'Smcsorl')
  assert.equal(displayName({ email: 'jane.doe@x.com' }), 'Jane Doe')
  assert.equal(displayName({ name: '  Steven McSorley  ', email: 'other@x.com' }), 'Steven McSorley')
  assert.equal(displayName({ name: 'jane_mary-doe@x.com' }), 'Jane Mary Doe')
  assert.equal(displayName({ name: '@x.com', email: 'jane.doe@x.com' }), 'Jane Doe')
  for (const person of [{ name: ' ', email: '' }, {}, null, undefined]) {
    assert.equal(displayName(person), '')
  }
})

test('updated dates switch from relative to abbreviated calendar dates at seven days', () => {
  const date = new Date(2026, 9, 7, 12)
  const day = 86_400_000
  for (const [elapsed, expected] of [
    [59_999, 'just now'],
    [5 * 60_000, '5m ago'],
    [3 * 3_600_000, '3h ago'],
    [4 * day, '4d ago'],
    [7 * day - 1, '6d ago'],
    [7 * day, 'Oct 7'],
  ]) {
    assert.equal(formatUpdated(date, date.getTime() + elapsed), expected)
  }
  const nextYear = new Date(2027, 0, 1, 12).getTime()
  assert.equal(formatUpdated(date.toISOString(), nextYear), 'Oct 7, 2026')
  assert.equal(formatUpdated('invalid', nextYear), '')
})

test('progress segments assign the rounding remainder to the track', () => {
  const segments = progressSegments({ total: 6, done: 1, code_review: 1, in_progress: 1, todo: 3 })
  assert.deepEqual({ ...segments }, { done: 16, review: 16, progress: 16, rest: 52 })
  assert.equal(Object.values(segments).reduce((sum, segment) => sum + segment, 0), 100)
  for (const [total, done, expected] of [
    [0, 0, { done: 0, review: 0, progress: 0, rest: 0 }],
    [5, 5, { done: 100, review: 0, progress: 0, rest: 0 }],
    [5, 0, { done: 0, review: 0, progress: 0, rest: 100 }],
  ]) {
    assert.deepEqual({ ...progressSegments({ total, done, code_review: 0, in_progress: 0 }) }, expected)
  }
})
