const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/sprintGoal.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {} }
vm.runInNewContext(compiled, context)
const { goalCounter } = context.exports

for (const [name, value, count, nearLimit, overLimit] of [
  ['empty goal', '', 0, false, false],
  ['below the warning threshold', 'a'.repeat(179), 179, false, false],
  ['at the warning threshold', 'a'.repeat(180), 180, true, false],
  ['at the limit', 'a'.repeat(200), 200, true, false],
  ['above the limit', 'a'.repeat(201), 201, true, true],
  ['trailing whitespace', 'a'.repeat(179) + '  \t\n', 179, false, false],
  ['leading and internal spaces', ' Ship  it', 9, false, false],
  ['multiline goal', 'First\n\nSecond', 13, false, false],
]) {
  test(`goalCounter handles ${name}`, () => {
    assert.deepEqual({ ...goalCounter(value) }, {
      count,
      text: `${count}/200`,
      nearLimit,
      overLimit,
    })
  })
}
