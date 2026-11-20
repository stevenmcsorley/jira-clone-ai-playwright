const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ts = require('typescript')
const vm = require('node:vm')

const loadComponent = (file, loadDependency = require) => {
  const source = readFileSync(join(__dirname, file), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  })
  const context = { exports: {}, require: loadDependency }
  vm.runInNewContext(outputText, context)
  return context.exports
}

const button = loadComponent('../ui/Button/Button.tsx')
const { FormActionBar } = loadComponent('FormActionBar.tsx', (name) =>
  name === '../ui/Button' ? button : require(name),
)

const renderBar = (overrides) => renderToStaticMarkup(createElement(FormActionBar, {
  formId: 'issue-form',
  onCancel: () => {},
  submitLabel: 'Save Changes',
  savingLabel: 'Saving...',
  saving: false,
  ...overrides,
}))

test('renders a mobile action bar with a native submit button associated with the form', () => {
  const html = renderBar()
  assert.match(html, /data-testid="form-action-bar"[^>]+md:hidden/)
  assert.match(html, /<button type="button"[^>]+min-h-11 flex-1">Cancel<\/button>/)
  assert.match(html, /<button type="submit"[^>]+min-h-11 flex-1" form="issue-form">Save Changes<\/button>/)
})

test('disables only submit when the form is invalid', () => {
  const html = renderBar({ disabled: true })
  assert.equal((html.match(/ disabled=""/g) ?? []).length, 1)
  assert.match(html, /<button type="submit"[^>]+ disabled=""[^>]*>Save Changes<\/button>/)
})

test('disables both actions and shows the saving label during submission', () => {
  const html = renderBar({ saving: true })
  assert.equal((html.match(/ disabled=""/g) ?? []).length, 2)
  assert.match(html, /<button type="submit"[^>]*>Saving\.\.\.<\/button>/)
})
