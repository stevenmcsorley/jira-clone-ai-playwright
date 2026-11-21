const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

/** The Workbench look: no emoji as icons, no gradients or shadows, no side stripes, no uppercase labels. */
const src = path.join(__dirname, '../src')
function* sources(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* sources(file)
    else if (/\.(tsx|ts)$/.test(entry.name)) yield { file, text: fs.readFileSync(file, 'utf8') }
  }
}
const offenders = (pattern, filter = () => true) => {
  const found = []
  for (const { file, text } of sources(src)) {
    if (!filter(file)) continue
    text.split(/\r?\n/).forEach((line, i) => { if (pattern.test(line)) found.push(`${path.relative(src, file)}:${i + 1}`) })
  }
  return found
}

test('no emoji or pictographs stand in for icons', () => {
  assert.deepEqual(offenders(/[\u{23E9}-\u{23FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u, f => !/test|\.test\./.test(f)), [])
})

test('flat surfaces: no gradients, no shadow utilities, no decorative backdrop blur', () => {
  // A mask-image fade that hints a row of tabs scrolls is a cue, not decoration, so it is allowed.
  assert.deepEqual(offenders(/(?<!mask-image:)(?:\bbg-gradient|linear-gradient|repeating-linear-gradient)|(?<=[\s"'`])(?:hover:)?shadow(?:-[a-z0-9]+)?(?=[\s"'`])|backdrop-blur/), [])
})

test('no one-sided stripe borders on boxes, and no uppercase tracking labels', () => {
  // Allowed: the reply rule in comment threads, a markdown blockquote's rule, and a tooltip arrow made from borders.
  const legitimate = /Comments\.tsx|Markdown\.tsx|TimeProgressBar\.tsx/
  assert.deepEqual(offenders(/(?<=[\s"'`])border-[lr]-[2-9](?=[\s"'`])/, f => !legitimate.test(f)), [])
  assert.deepEqual(offenders(/(?<=[\s"'`])uppercase(?=[\s"'`])/), [])
})
