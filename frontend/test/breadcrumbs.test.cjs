const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/breadcrumbs.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const context = { exports: {} }
vm.runInNewContext(compiled, context)
const { buildBreadcrumbs, visibleCrumbIndexes } = context.exports

const project = { name: 'Ossicone', key: 'OSS' }
const projectPath = '/projects/1'
const projectsLink = { label: 'Projects', href: '/projects' }
const projectLink = { label: project.name, href: projectPath }
const issuesLink = { label: 'Issues', href: projectPath + '/issues' }
const reportsLink = { label: 'Reports', href: projectPath + '/reports' }
const active = (label) => ({ label, isActive: true })
const build = (input) => Array.from(buildBreadcrumbs(input), (crumb) => ({ ...crumb }))

for (const [suffix, label] of [
  ['', 'Board'],
  ['/backlog', 'Backlog'],
  ['/issues', 'Issues'],
  ['/issues/create', 'Issues'],
  ['/search', 'Search Results'],
  ['/history', 'Sprint History'],
  ['/components', 'Components'],
  ['/releases', 'Releases'],
  ['/settings', 'Settings'],
  ['/reports', 'Reports'],
]) {
  const pathname = projectPath + suffix
  test(`builds the breadcrumb trail for ${pathname}`, () => {
    assert.deepEqual(build({ pathname, projectId: '1', project }), [
      projectsLink, projectLink, active(label),
    ])
  })
}

for (const [slug, label] of [
  ['burndown', 'Burndown Chart'],
  ['burnup', 'Burnup Report'],
  ['velocity', 'Velocity Report'],
  ['cumulative-flow', 'Cumulative Flow Diagram'],
  ['cycle-time', 'Cycle Time Report'],
]) {
  test(`links back to Reports from the ${slug} report`, () => {
    assert.deepEqual(build({ pathname: reportsLink.href + '/' + slug, projectId: '1', project }), [
      projectsLink, projectLink, reportsLink, active(label),
    ])
  })
}

test('builds the issue detail and edit trails', () => {
  const pathname = issuesLink.href + '/7'
  const input = { pathname, projectId: '1', issueId: '7', project }
  assert.deepEqual(build(input), [projectsLink, projectLink, issuesLink, active('OSS-7')])
  assert.deepEqual(build({ ...input, pathname: pathname + '/edit' }), [
    projectsLink, projectLink, issuesLink, { ...active('OSS-7'), href: pathname }, active('Edit'),
  ])
})

test('builds the projects list and create-project trails without a project', () => {
  assert.deepEqual(build({ pathname: '/projects' }), [active('Projects')])
  assert.deepEqual(build({ pathname: '/projects/create' }), [projectsLink, active('Create Project')])
})

test('falls back to the project links on an unknown path when the project is available', () => {
  const pathname = projectPath + '/unknown'
  assert.deepEqual(build({ pathname, projectId: '1', project }), [projectsLink, projectLink])
  assert.deepEqual(build({ pathname, projectId: '1', project: null }), [])
  assert.deepEqual(build({ pathname: '/unknown' }), [])
})

for (const [count, lastTwo, lastOne] of [
  [0, [], []],
  [1, [0], [0]],
  [2, [0, 1], [1]],
  [3, [1, 2], [2]],
  [5, [3, 4], [4]],
]) {
  test(`selects the trailing visible indexes for ${count} crumbs`, () => {
    assert.deepEqual(Array.from(visibleCrumbIndexes(count)), lastTwo)
    assert.deepEqual(Array.from(visibleCrumbIndexes(count, 1)), lastOne)
  })
}
