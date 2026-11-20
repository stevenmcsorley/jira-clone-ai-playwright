const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/projectDescription.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {} }
vm.runInNewContext(compiled, context)
const { tidyDescription, splitParagraphs } = context.exports

test('tidyDescription returns empty text for missing or whitespace-only input', () => {
  for (const raw of [null, undefined, ' \t\r\n ']) {
    assert.equal(tidyDescription(raw), '')
  }
})

test('tidyDescription normalizes CRLF and removes trailing whitespace from each line', () => {
  assert.equal(tidyDescription('First  \t\r\nSecond \r\nThird\t'), 'First\nSecond\nThird')
})

test('tidyDescription collapses runs of tabs and spaces', () => {
  assert.equal(tidyDescription('First\t  second   third'), 'First second third')
})

test('tidyDescription keeps at most two consecutive newlines', () => {
  assert.equal(tidyDescription('First\n\n\n\nSecond\n \t\n\nThird'), 'First\n\nSecond\n\nThird')
})

test('splitParagraphs keeps a single paragraph and its line breaks', () => {
  assert.deepEqual(Array.from(splitParagraphs('First line\nSecond line')), ['First line\nSecond line'])
})

test('splitParagraphs returns each paragraph separated by blank lines', () => {
  assert.deepEqual(Array.from(splitParagraphs('First\n\nSecond\n\nThird')), ['First', 'Second', 'Third'])
})

test('splitParagraphs skips whitespace-only entries', () => {
  assert.deepEqual(Array.from(splitParagraphs('First\n \t\n\n \t\nSecond')), ['First', 'Second'])
  assert.deepEqual(Array.from(splitParagraphs(' \t\n\n ')), [])
})
