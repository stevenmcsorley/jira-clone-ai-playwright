const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/pagination.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {} }
vm.runInNewContext(compiled, context)
const { clampPage, getPageCount, paginate, getPageNumbers } = context.exports

test('clamps pages to the available range and defaults invalid pages to one', () => {
  assert.equal(clampPage(3, 5), 3)
  assert.equal(clampPage(1_000, 5), 5)
  assert.equal(clampPage(3, 0), 1)
  for (const page of [0, -1, 2.5, NaN, Infinity]) {
    assert.equal(clampPage(page, 5), 1)
  }
})

test('counts pages and treats invalid sizes as one', () => {
  assert.equal(getPageCount(0, 12), 1)
  assert.equal(getPageCount(24, 12), 2)
  assert.equal(getPageCount(40, 12), 4)
  for (const size of [0, -1, 0.5, NaN, Infinity]) {
    assert.equal(getPageCount(4, size), 4)
  }
})

test('paginates with one-based bounds and returns zero bounds for empty lists', () => {
  const cases = [
    [[], 2, 12, { items: [], page: 1, pageCount: 1, start: 0, end: 0, total: 0 }],
    [[1, 2, 3, 4], 2, 2, { items: [3, 4], page: 2, pageCount: 2, start: 3, end: 4, total: 4 }],
    [[1, 2, 3, 4, 5], 3, 2, { items: [5], page: 3, pageCount: 3, start: 5, end: 5, total: 5 }],
    [[1, 2, 3], 0, 2, { items: [1, 2], page: 1, pageCount: 2, start: 1, end: 2, total: 3 }],
    [[1, 2, 3], 1_000, 2, { items: [3], page: 2, pageCount: 2, start: 3, end: 3, total: 3 }],
    [[1, 2, 3], 2, 0, { items: [2], page: 2, pageCount: 3, start: 2, end: 2, total: 3 }],
  ]
  for (const [items, page, size, expected] of cases) {
    assert.deepEqual({ ...paginate(Object.freeze(items), page, size) }, expected)
  }
})

test('keeps the first, last and neighbouring pages and fills single-page gaps', () => {
  const cases = [
    [1, 5, [1, 2, 3, 4, 5]],
    [1, 20, [1, 2, 'ellipsis', 20]],
    [10, 20, [1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]],
    [19, 20, [1, 'ellipsis', 18, 19, 20]],
    [5, 9, [1, 'ellipsis', 4, 5, 6, 'ellipsis', 9]],
    [8, 8, [1, 'ellipsis', 7, 8]],
    [4, 7, [1, 2, 3, 4, 5, 6, 7]],
    [4, 8, [1, 2, 3, 4, 5, 'ellipsis', 8]],
    [5, 8, [1, 'ellipsis', 4, 5, 6, 7, 8]],
  ]
  for (const [page, count, expected] of cases) {
    assert.deepEqual(Array.from(getPageNumbers(page, count)), expected)
  }
})
