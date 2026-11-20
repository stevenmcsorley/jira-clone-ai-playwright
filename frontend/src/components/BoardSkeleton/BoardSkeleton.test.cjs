const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')
const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

const source = fs.readFileSync(path.join(__dirname, 'BoardSkeleton.tsx'), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText
const context = { exports: {}, require }
vm.runInNewContext(compiled, context)
const { BoardSkeleton } = context.exports

test('announces a busy board and renders four scrollable columns with three cards each', () => {
  const skeleton = BoardSkeleton({})
  const markup = renderToStaticMarkup(createElement(BoardSkeleton))
  assert.match(markup, /role="status" aria-busy="true" aria-label="Loading project board"/)
  assert.match(markup, /data-testid="board-loading"/)
  assert.match(markup, /motion-safe:animate-pulse/)
  const [, columnRow] = skeleton.props.children.props.children
  assert.match(columnRow.props.className, /overflow-x-auto/)
  assert.equal(columnRow.props.children.length, 4)
  for (const column of columnRow.props.children) {
    const [, cards] = column.props.children
    assert.equal(cards.length, 3)
  }
})
