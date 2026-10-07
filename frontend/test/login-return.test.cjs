const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')
const source = fs.readFileSync(path.join(__dirname, '../src/lib/login-return.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {}, URLSearchParams }; vm.runInNewContext(compiled, context)
const { loginReturn } = context.exports
test('login resumes only the exact OAuth consent path', () => {
  const target = '/oauth/consent?request=' + 'a'.repeat(43)
  assert.equal(loginReturn('?returnTo=' + encodeURIComponent(target)), target)
  for (const bad of ['https://evil.test', '//evil.test', '/projects', '/oauth/consent?request=bad', target + '&redirect=https://evil.test'])
    assert.equal(loginReturn('?returnTo=' + encodeURIComponent(bad)), '/projects')
  assert.equal(loginReturn(''), '/projects')
})
