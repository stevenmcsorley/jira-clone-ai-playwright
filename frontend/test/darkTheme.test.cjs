const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const src = path.join(__dirname, '../src')
const css = fs.readFileSync(path.join(src, 'index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const hues = 'blue|green|red|yellow|orange|purple|amber|indigo'
const tintUtility = new RegExp(`\\b(?:bg|border|ring|divide|from|to|via)-(${hues})-(50|100|200)\\b`, 'g')
const textUtility = new RegExp(`\\btext-(?:${hues})-(?:50|100|200|300|500|600|700|800|900)\\b`, 'g')

function* readSources(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      yield* readSources(file)
    } else if (/\.(?:[cm]?[jt]sx?|html)$/.test(entry.name)) {
      yield { file, source: fs.readFileSync(file, 'utf8') }
    }
  }
}

test('dark palette covers all color tints and foregrounds used by the app', () => {
  const dark = css.match(/^\s*\.dark\s*\{([^}]*)\}/m)?.[1]
  assert.ok(dark, 'Missing .dark palette block')
  const properties = new Set(Array.from(dark.matchAll(/(--color-[\w-]+)\s*:/g), match => match[1]))
  const missing = new Set()

  for (const { source } of readSources(src)) {
    for (const [utility, hue, shade] of source.matchAll(tintUtility)) {
      if (!properties.has(`--color-${hue}-${shade}`)) missing.add(utility)
    }
    for (const [utility] of source.matchAll(textUtility)) {
      const selector = new RegExp(`\\.dark\\s+\\.${utility}\\s*(?:,|\\{)`)
      if (!selector.test(css)) missing.add(utility)
    }
  }

  for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
    const property = `--color-gray-${shade}`
    if (!properties.has(property)) missing.add(property)
  }

  assert.deepEqual([...missing].sort(), [], 'Missing dark palette overrides')
  assert.doesNotMatch(css, /--color-white\s*:/)
})

test('always-dark panels use the slate family', () => {
  const darkGrayUtility = /(?<![\w-])(?:bg|border|divide|from|to|via|ring)-gray-(?:700|800|900)(?![\w-])/
  const offenders = []

  for (const { file, source } of readSources(src)) {
    source.split(/\r?\n/).forEach((line, index) => {
      if (darkGrayUtility.test(line)) {
        offenders.push(`${path.relative(path.join(src, '../..'), file)}:${index + 1}`)
      }
    })
  }

  assert.equal(offenders.length, 0, [
    'Use the slate family for always-dark panels. Dark gray utilities flip to light colours in dark mode.',
    ...offenders,
  ].join('\n'))
})
