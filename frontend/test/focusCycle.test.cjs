const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/focusCycle.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {} }
vm.runInNewContext(compiled, context)
const { nextFocusIndex } = context.exports

test('cycles forward and wraps from last to first', () => {
  assert.equal(nextFocusIndex(0, 3, false), 1)
  assert.equal(nextFocusIndex(2, 3, false), 0)
})

test('cycles backward and wraps from first to last', () => {
  assert.equal(nextFocusIndex(2, 3, true), 1)
  assert.equal(nextFocusIndex(0, 3, true), 2)
})

test('has no target for an empty list', () => {
  assert.equal(nextFocusIndex(-1, 0, false), -1)
  assert.equal(nextFocusIndex(-1, 0, true), -1)
})

test('keeps focus on a single tab stop', () => {
  assert.equal(nextFocusIndex(0, 1, false), 0)
  assert.equal(nextFocusIndex(0, 1, true), 0)
})

test('enters the list at the appropriate end when focus is outside it', () => {
  assert.equal(nextFocusIndex(-1, 3, false), 0)
  assert.equal(nextFocusIndex(-1, 3, true), 2)
  assert.equal(nextFocusIndex(3, 3, false), 0)
})
