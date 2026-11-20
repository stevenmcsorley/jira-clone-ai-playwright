const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { MemoryRouter } = require('react-router-dom')

const load = (file, requireModule = require) => {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const context = { exports: {}, require: requireModule }
  vm.runInNewContext(compiled, context)
  return context.exports
}

const priority = load('issuePriority.ts')
const { BacklogIssueCard } = load('BacklogIssueCard.tsx', name =>
  name === './issuePriority' ? priority : require(name))
const { BacklogSkeleton } = load('../BacklogSkeleton/BacklogSkeleton.tsx')

const issue = {
  id: 17,
  projectId: 9,
  title: 'A'.repeat(300),
  type: 'bug',
  status: 'code_review',
  priority: 'urgent',
  updatedAt: new Date(2025, 9, 7, 12),
}

const renderCard = props => renderToStaticMarkup(
  createElement(MemoryRouter, null, createElement(BacklogIssueCard, { projectKey: 'JC', issue, ...props })),
)

test('renders a wrapping issue link, badges, and optional updated date without actions', () => {
  const markup = renderCard({ showUpdated: true, onDragStart() {} })
  assert.match(markup, /draggable="true" data-testid="backlog-issue-card-17"/)
  assert.match(markup, /bg-red-100 text-red-800">bug</)
  assert.match(markup, /JC-17/)
  assert.match(markup, /text-red-600">⇈</)
  assert.match(markup, /<time[^>]*>Oct 7, 2025/)
  assert.match(markup, /line-clamp-2 wrap-anywhere[^"]*" href="\/projects\/9\/issues\/17"/)
  assert.ok(markup.includes(issue.title))
  assert.match(markup, /bg-purple-100 text-purple-800">Code Review</)
  assert.match(markup, /Unassigned/)
  assert.doesNotMatch(markup, /<button/)
})

test('renders sprint actions, story points, and the assignee without an updated date', () => {
  const markup = renderCard({
    issue: { ...issue, storyPoints: 5, assignee: { name: 'Sam Example' } },
    actions: createElement('button', null, 'Remove'),
  })
  assert.match(markup, /bg-blue-50 text-blue-700 rounded-full">5</)
  assert.match(markup, /text-white">S</)
  assert.match(markup, /truncate text-sm text-gray-700">Sam Example</)
  assert.match(markup, /<button>Remove<\/button>/)
  assert.doesNotMatch(markup, /<time/)
})

test('announces loading and shows two sets of three placeholders', () => {
  const markup = renderToStaticMarkup(createElement(BacklogSkeleton))
  assert.match(markup, /role="status" aria-busy="true" aria-label="Loading backlog"/)
  assert.match(markup, /data-testid="backlog-loading"/)
  assert.match(markup, /motion-safe:animate-pulse/)
  const [, content] = BacklogSkeleton({}).props.children
  assert.equal(content.props.children.length, 2)
  for (const sprint of content.props.children) {
    const [, rows] = sprint.props.children
    assert.equal(rows.props.children.length, 3)
  }
})
