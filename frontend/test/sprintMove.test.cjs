const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/sprintMove.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {} }
vm.runInNewContext(compiled, context)
const { sprintMoveTargets, moveAnnouncement } = context.exports

const future = { id: 3, name: 'Next sprint', status: 'future' }
const later = { id: 1, name: 'Later sprint', status: 'future' }
const completed = { id: 2, name: 'Past sprint', status: 'completed' }
const active = { id: 4, name: 'Current sprint', status: 'active' }

const targets = (current, sprints) => Array.from(sprintMoveTargets(current, sprints), target => ({ ...target }))

test('backlog issues can move to future sprints in the given order', () => {
  assert.deepEqual(targets(null, [future, completed, later]), [
    { id: 3, label: 'Next sprint' },
    { id: 1, label: 'Later sprint' },
  ])
})

test('sprint issues offer Backlog first and exclude their own and completed sprints', () => {
  assert.deepEqual(targets(3, [future, completed, later]), [
    { id: null, label: 'Backlog' },
    { id: 1, label: 'Later sprint' },
  ])
})

test('active sprints are labelled with an active suffix', () => {
  assert.deepEqual(targets(undefined, [active]), [{ id: 4, label: 'Current sprint (active)' }])
})

test('backlog issues with no available sprints have no targets', () => {
  assert.deepEqual(targets(undefined, []), [])
  assert.deepEqual(targets(null, [completed]), [])
})

test('sprint issues can move to Backlog even when no other sprint is available', () => {
  assert.deepEqual(targets(3, [future, completed]), [{ id: null, label: 'Backlog' }])
  assert.deepEqual(targets(3, []), [{ id: null, label: 'Backlog' }])
})

test('moveAnnouncement includes the issue title and destination', () => {
  assert.equal(moveAnnouncement('Fix login', 'Next sprint'), 'Moved "Fix login" to Next sprint')
})

test('moveAnnouncement trims the title', () => {
  assert.equal(moveAnnouncement('  Fix login \n', 'Backlog'), 'Moved "Fix login" to Backlog')
})

test('moveAnnouncement adds an ellipsis only beyond 60 characters', () => {
  const title = 'a'.repeat(60)
  assert.equal(moveAnnouncement(title, 'Backlog'), `Moved "${title}" to Backlog`)
  assert.equal(moveAnnouncement(` ${title}b `, 'Backlog'), `Moved "${title}…" to Backlog`)
})

test('moveAnnouncement accepts an empty title', () => {
  assert.equal(moveAnnouncement('', 'Backlog'), 'Moved "" to Backlog')
})
