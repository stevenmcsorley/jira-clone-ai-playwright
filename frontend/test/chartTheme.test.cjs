const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/chartTheme.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {} }
vm.runInNewContext(compiled, context)
const { chartTheme, applyChartTheme } = context.exports

function luminance(hex) {
  return [0.2126, 0.7152, 0.0722].reduce((total, weight, index) => {
    const channel = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    return total + weight * linear
  }, 0)
}

test('both chart palettes provide all colours and dark mode uses lighter text', () => {
  const keys = ['border', 'grid', 'mutedText', 'text', 'tooltipBackground', 'tooltipBorder', 'tooltipText']
  for (const name of ['light', 'dark']) {
    const theme = chartTheme(name)
    assert.deepEqual(Object.keys(theme).sort(), keys)
    for (const key of keys) {
      assert.match(theme[key], /^(#|rgba\()/)
    }
  }
  assert.ok(luminance(chartTheme('dark').text) > luminance(chartTheme('light').text))
})

test('applyChartTheme merges colours without mutating options or adding scales', () => {
  const callbacks = { label: () => 'label' }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { ticks: { maxRotation: 45, color: 'red' }, grid: { display: false } } },
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } }, tooltip: { callbacks } },
  }
  const original = JSON.stringify(options)

  for (const name of ['light', 'dark']) {
    const themed = applyChartTheme(options, name)
    const theme = chartTheme(name)
    assert.notEqual(themed, options)
    assert.equal(JSON.stringify(options), original)
    assert.equal(themed.responsive, true)
    assert.equal(themed.maintainAspectRatio, false)
    assert.equal(themed.color, theme.text)
    assert.deepEqual(Object.keys(themed.scales), ['x'])
    assert.deepEqual({ ...themed.scales.x.ticks }, { maxRotation: 45, color: theme.mutedText })
    assert.deepEqual({ ...themed.scales.x.grid }, { display: false, color: theme.grid })
    assert.equal(themed.scales.x.border.color, theme.border)
    assert.equal(themed.scales.x.title.color, theme.text)
    assert.equal(themed.plugins.legend.position, 'bottom')
    assert.deepEqual({ ...themed.plugins.legend.labels }, { boxWidth: 10, color: theme.text })
    assert.equal(themed.plugins.title.color, theme.text)
    assert.equal(themed.plugins.tooltip.callbacks, callbacks)
    assert.equal(themed.plugins.tooltip.backgroundColor, theme.tooltipBackground)
    assert.equal(themed.plugins.tooltip.titleColor, theme.tooltipText)
    assert.equal(themed.plugins.tooltip.bodyColor, theme.tooltipText)
    assert.equal(themed.plugins.tooltip.borderColor, theme.tooltipBorder)
  }
  assert.equal(Object.hasOwn(applyChartTheme({}, 'dark'), 'scales'), false)
  assert.equal(applyChartTheme({ plugins: false }, 'dark').plugins, false)
})
