const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/boardMove.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {} }
vm.runInNewContext(compiled, context)
const { moveTargets, moveAnnouncement } = context.exports

const statuses = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'code_review', label: 'Code Review' },
  { id: 'done', label: 'Done' },
]

for (const { id } of statuses) {
  test(`moveTargets excludes ${id} and preserves board order`, () => {
    assert.deepEqual(Array.from(moveTargets(id), target => ({ ...target })), statuses.filter(status => status.id !== id))
  })
}

test('moveTargets returns all statuses for an unknown status', () => {
  assert.deepEqual(Array.from(moveTargets('unknown'), target => ({ ...target })), statuses)
})

test('moveAnnouncement includes the title and destination', () => {
  assert.equal(moveAnnouncement('Fix login', 'Done'), 'Moved "Fix login" to Done')
})

test('moveAnnouncement trims surrounding whitespace', () => {
  assert.equal(moveAnnouncement('  Fix login \n', 'To Do'), 'Moved "Fix login" to To Do')
})

test('moveAnnouncement adds an ellipsis only beyond 60 characters', () => {
  const title = 'a'.repeat(60)
  assert.equal(moveAnnouncement(title, 'Done'), `Moved "${title}" to Done`)
  assert.equal(moveAnnouncement(` ${title}b `, 'Done'), `Moved "${title}…" to Done`)
})

test('moveAnnouncement accepts an empty title', () => {
  assert.equal(moveAnnouncement('', 'Code Review'), 'Moved "" to Code Review')
})
