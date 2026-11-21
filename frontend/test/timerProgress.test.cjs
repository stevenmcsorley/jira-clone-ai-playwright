const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/timerProgress.ts'), 'utf8')
const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
const { getTimerProgress, formatClock } = context.exports
const HOUR = 3_600_000

test('progress is green until 90% of the estimate, yellow to 110%, then red', () => {
  assert.equal(getTimerProgress(0.5 * HOUR, 1).color, 'green')
  assert.equal(getTimerProgress(0.95 * HOUR, 1).color, 'yellow')
  assert.equal(getTimerProgress(1.2 * HOUR, 1).color, 'red')
  assert.equal(getTimerProgress(HOUR, 0).percentage, 0)
})

test('the bar never draws past full, and remaining time never goes negative', () => {
  const p = getTimerProgress(3 * HOUR, 1)
  assert.equal(p.percentage, 100)
  assert.equal(p.remainingHours, 0)
})

test('formatClock reads as a clock', () => {
  assert.equal(formatClock(0), '0:00')
  assert.equal(formatClock(42_000), '0:42')
  assert.equal(formatClock(12 * 60_000), '12:00')
  assert.equal(formatClock(4_320_000), '1:12:00')
  assert.equal(formatClock(-5), '0:00')
})
