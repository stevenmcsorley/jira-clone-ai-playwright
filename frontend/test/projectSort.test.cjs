const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const vm = require('node:vm')

const loadHelper = (name, imports = {}, searchParams = URLSearchParams) => {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils', name + '.ts'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const context = { exports: {}, URLSearchParams: searchParams, require: (id) => imports[id] }
  vm.runInNewContext(compiled, context)
  return context.exports
}

const { SORT_OPTIONS, sortProjects, filterProjects, parseListState, listStateToSearch } =
  loadHelper('projectSort', { './projectStats': loadHelper('projectStats') })

const now = Date.parse('2026-11-20T12:00:00Z')
const projects = [
  {
    id: 4, name: 'Delta', key: 'DLT', description: 'Public API', lead: { name: 'Avery' },
    createdAt: '2026-10-01', updatedAt: '2026-11-20', issues: [],
  },
  {
    id: 2, name: 'bravo', key: 'BRV', description: 'Private API', lead: { name: 'Casey' },
    createdAt: '2026-11-07', updatedAt: '2026-11-19',
    issues: [{ status: 'done', createdAt: '2026-11-19', updatedAt: '2026-11-19' }],
  },
  {
    id: 1, name: 'Alpha', key: 'ALP', lead: { name: 'Casey' },
    createdAt: '2026-11-01', updatedAt: '2026-11-18',
    issues: [
      { status: 'done', createdAt: '2026-11-12', updatedAt: '2026-11-13' },
      { status: 'in_progress', createdAt: '2026-11-14', updatedAt: '2026-11-15' },
      { status: 'todo', createdAt: '2026-11-10' },
    ],
  },
  {
    id: 3, name: 'Charlie', key: 'CHR',
    createdAt: '2026-10-20', updatedAt: '2026-11-18',
    issues: [{ status: 'done', createdAt: '2026-10-22' }, { status: 'done', createdAt: '2026-11-06' }],
  },
]

const ids = (list) => Array.from(list, (project) => project.id)

const expectedOrders = {
  updated: [4, 2, 1, 3],
  created: [2, 1, 3, 4],
  'issue-added': [2, 1, 3, 4],
  active: [1, 2, 3, 4],
  open: [1, 2, 3, 4],
  closest: [3, 2, 1, 4],
  name: [1, 2, 3, 4],
}

test('sort options appear in the requested order', () => {
  assert.deepEqual(Array.from(SORT_OPTIONS, ({ id }) => id), Object.keys(expectedOrders))
})

for (const [sort, expected] of Object.entries(expectedOrders)) {
  test(`sorts by ${sort} and keeps the original array intact`, () => {
    const input = Object.freeze([...projects])
    const sorted = sortProjects(input, sort, now)
    assert.deepEqual(ids(sorted), expected)
    assert.notStrictEqual(sorted, input)
    assert.deepEqual(ids(input), [4, 2, 1, 3])
  })
}

test('ties fall back to case-insensitive name, then id, then input order', () => {
  const input = [
    { id: 3, name: 'alpha' },
    { id: 2, name: 'Bravo' },
    { id: 1, name: 'Alpha' },
    { id: 1, name: 'ALPHA' },
  ]
  assert.deepEqual(Array.from(sortProjects(input, 'updated'), ({ name }) => name),
    ['Alpha', 'ALPHA', 'alpha', 'Bravo'])
})

test('sorts with missing dates, missing issues and invalid dates', () => {
  const input = [
    { id: 1, name: 'Empty' },
    { id: 2, name: 'Invalid', updatedAt: 'broken', createdAt: 'broken', issues: [{ status: 'todo', createdAt: 'broken' }] },
    { id: 3, name: 'Valid', updatedAt: '2026-11-18', createdAt: '2026-11-10', issues: [{ status: 'todo', createdAt: '2026-11-17', updatedAt: 'broken' }] },
  ]
  for (const sort of ['updated', 'created', 'active', 'issue-added']) {
    assert.deepEqual(ids(sortProjects(input, sort, now)), sort === 'issue-added' ? [3, 2, 1] : [3, 1, 2])
  }
  assert.deepEqual(ids(sortProjects(input, 'closest', now)), [2, 3, 1])
  assert.deepEqual(ids(sortProjects(projects, 'unknown', now)), expectedOrders.updated)
})

test('finds substrings in name, key, description and lead name, ignoring case', () => {
  for (const [query, expected] of [
    ['  LPh  ', [1]], ['bRv', [2]], ['PUBLIC', [4]], ['aseY', [2, 1]], ['API', [4, 2]],
    ['api\t CASEY', [2]], ['api alpha', []],
  ]) {
    assert.deepEqual(ids(filterProjects(projects, query)), expected)
  }
  for (const query of ['', ' \t ']) {
    const result = filterProjects(projects, query)
    assert.deepEqual(ids(result), ids(projects))
    assert.notStrictEqual(result, projects)
  }
})

test('parses URL state, validates stored sorts and limits the trimmed query', () => {
  const state = (search, storedSort) => ({ ...parseListState(search, storedSort) })
  assert.deepEqual(state('?q=+api+&sort=active', 'open'), { q: 'api', sort: 'active' })
  assert.deepEqual(state('?sort=unknown', 'open'), { q: '', sort: 'open' })
  assert.deepEqual(state('?sort=unknown', 'invalid'), { q: '', sort: 'updated' })
  assert.deepEqual(state('', 'name'), { q: '', sort: 'name' })
  assert.equal(state('?q=++' + 'x'.repeat(120)).q, 'x'.repeat(100))
})

test('serializes URL state without defaults', () => {
  assert.equal(listStateToSearch({ q: '', sort: 'updated' }), '')
  assert.equal(listStateToSearch({ q: 'api tools', sort: 'updated' }), '?q=api+tools')
  assert.equal(listStateToSearch({ q: '', sort: 'active' }), '?sort=active')
  assert.equal(listStateToSearch({ q: 'a&b', sort: 'open' }), '?q=a%26b&sort=open')
})

test('serializes URL state using set and toString when URLSearchParams has no size', () => {
  class LegacySearchParams {
    #params = new URLSearchParams()

    set(name, value) {
      this.#params.set(name, value)
    }

    toString() {
      return this.#params.toString()
    }

    [Symbol.toPrimitive]() {
      assert.fail('expected an explicit call to toString()')
    }
  }

  assert.equal('size' in new LegacySearchParams(), false)
  const { listStateToSearch } = loadHelper('projectSort', { './projectStats': loadHelper('projectStats') }, LegacySearchParams)
  assert.equal(listStateToSearch({ q: 'a&b', sort: 'open' }), '?q=a%26b&sort=open')
  assert.equal(listStateToSearch({ q: '', sort: 'updated' }), '')
})
