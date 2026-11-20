const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/theme.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {} }
vm.runInNewContext(compiled, context)
const { DEFAULT_THEME, THEME_STORAGE_KEY, parseTheme, resolveTheme, nextTheme, themeLabel } = context.exports

test('only accepts the three preferences and defaults to dark', () => {
  assert.equal(DEFAULT_THEME, 'dark')
  for (const preference of ['dark', 'light', 'system']) {
    assert.equal(parseTheme(preference), preference)
  }
  for (const value of ['Dark', '', undefined, null, true, 1, {}]) {
    assert.equal(parseTheme(value), 'dark')
  }
})

test('only system follows the operating system setting', () => {
  for (const systemPrefersDark of [true, false]) {
    assert.equal(resolveTheme('dark', systemPrefersDark), 'dark')
    assert.equal(resolveTheme('light', systemPrefersDark), 'light')
    assert.equal(resolveTheme('system', systemPrefersDark), systemPrefersDark ? 'dark' : 'light')
  }
})

test('cycles dark, light, system and labels each preference', () => {
  assert.equal(nextTheme('dark'), 'light')
  assert.equal(nextTheme('light'), 'system')
  assert.equal(nextTheme('system'), 'dark')
  assert.equal(themeLabel('dark'), 'Dark')
  assert.equal(themeLabel('light'), 'Light')
  assert.equal(themeLabel('system'), 'System')
})

test('the head script resolves the same theme before React starts', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8')
  const script = html.match(/<head>[\s\S]*?<script>([\s\S]*?)<\/script>/)?.[1]
  assert.ok(script, 'Missing inline theme script in the head')

  for (const value of [null, 'invalid', 'dark', 'light', 'system', undefined]) {
    for (const systemPrefersDark of [true, false]) {
      const expected = resolveTheme(parseTheme(value), systemPrefersDark)
      const style = {}
      let dark
      let themeColor
      vm.runInNewContext(script, {
        localStorage: {
          getItem(key) {
            assert.equal(key, THEME_STORAGE_KEY)
            if (value === undefined) throw new Error('Storage unavailable')
            return value
          },
        },
        matchMedia(query) {
          assert.equal(query, '(prefers-color-scheme: dark)')
          return { matches: systemPrefersDark }
        },
        document: {
          documentElement: { style, classList: { toggle: (name, force) => { dark = name === 'dark' && force } } },
          querySelector: () => ({ setAttribute: (name, color) => { themeColor = color } }),
        },
      })
      assert.equal(dark, expected === 'dark')
      assert.equal(style.colorScheme, expected)
      assert.equal(themeColor, expected === 'dark' ? '#0b1120' : '#2563eb')
    }
  }
})
