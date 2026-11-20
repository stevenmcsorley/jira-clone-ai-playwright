const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ts = require('typescript')
const vm = require('node:vm')

test('exposes one loading status and hides the filter and six row placeholders from assistive technology', () => {
  const source = readFileSync(join(__dirname, 'IssuesSkeleton.tsx'), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  })
  const context = { exports: {}, require }
  vm.runInNewContext(outputText, context)

  const html = renderToStaticMarkup(createElement(context.exports.IssuesSkeleton))
  assert.equal((html.match(/role="status"/g) ?? []).length, 1)
  assert.match(html, /aria-busy="true" aria-label="Loading issues" data-testid="issues-loading"/)
  assert.match(html, /motion-safe:animate-pulse/)
  assert.equal((html.match(/aria-hidden="true"/g) ?? []).length, 7)
})
