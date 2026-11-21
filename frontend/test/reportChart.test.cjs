const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/reportChart.ts'), 'utf8')
const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
const { chartHasData, withReportStyle } = context.exports

test('a chart of zeros is not a report: it is empty', () => {
  assert.equal(chartHasData({ datasets: [{ data: [0, 0, 0] }, { data: [0] }] }), false)
  assert.equal(chartHasData({ datasets: [{ data: [] }] }), false)
  assert.equal(chartHasData({ datasets: [{ data: [0, 2, 0] }] }), true)
  assert.equal(chartHasData({ datasets: [{ data: [{ x: 1, y: 3 }] }] }), true)
})

test('report charts get no vertical grid, no rotated labels, no axis frame, and no point markers', () => {
  const styled = withReportStyle({ scales: { x: { ticks: { maxRotation: 45 }, grid: { display: true } }, y: { beginAtZero: true } } })
  assert.equal(styled.scales.x.grid.display, false)
  assert.equal(styled.scales.x.ticks.maxRotation, 0)
  assert.equal(styled.scales.x.ticks.autoSkip, true)
  assert.equal(styled.scales.x.border.display, false)
  assert.equal(styled.scales.y.beginAtZero, true)
  assert.equal(styled.scales.y.border.display, false)
  assert.equal(styled.elements.point.radius, 0)
})

test('options without scales still get the point style, and nothing is mutated', () => {
  const options = { responsive: true }
  const styled = withReportStyle(options)
  assert.equal(styled.responsive, true)
  assert.equal(styled.elements.point.hoverRadius, 4)
  assert.equal(options.elements, undefined)
})

test('every report page uses the shared empty state and house style', () => {
  for (const f of ['BurnupReport/BurnupReport', 'BurndownChart/BurndownChart', 'VelocityReport/VelocityReport', 'CumulativeFlowDiagram/CumulativeFlowDiagram', 'CycleTimeReport/CycleTimeReport']) {
    const text = fs.readFileSync(path.join(__dirname, `../src/components/Reports/${f}.tsx`), 'utf8')
    assert.match(text, /withReportStyle\(chartOptions\)/, `${f} is missing the house style`)
    assert.match(text, /chartHasData\(chartData\)/, `${f} is missing the empty state`)
  }
})
