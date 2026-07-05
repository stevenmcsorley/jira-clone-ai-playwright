import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { useIssues } from '../../hooks/useIssues'
import { Button } from '../../components/ui/Button'
import { IssueTypeIcon } from '../../components/IssueTypeIcon'
import type { Issue, IssueStatus, IssuePriority, IssueType } from '../../types/domain.types'

const PAGE_SIZE = 25

type SortKey = 'title' | 'type' | 'status' | 'priority' | 'assignee' | 'points' | 'updated'
type SortDir = 'asc' | 'desc'

const PRIORITY_RANK: Record<IssuePriority, number> = { low: 1, medium: 2, high: 3, urgent: 4 }
// Board column order
const STATUS_RANK: Record<IssueStatus, number> = { todo: 1, in_progress: 2, code_review: 3, done: 4 }

/** Normalise story points (number, numeric string, or t-shirt size) to a number, or null when absent. */
const pointsValue = (storyPoints: Issue['storyPoints']): number | null => {
  if (storyPoints === null || storyPoints === undefined || storyPoints === '') return null
  if (typeof storyPoints === 'number') return storyPoints
  if (!isNaN(Number(storyPoints))) return Number(storyPoints)
  const map: Record<string, number> = { XS: 1, S: 3, M: 5, L: 8, XL: 13, XXL: 21 }
  return map[storyPoints] ?? null
}

/** Extract the comparable value for a column; null means "sort last". */
const sortValue = (issue: Issue, key: SortKey): string | number | null => {
  switch (key) {
    case 'title':
      return issue.title ? issue.title.toLowerCase() : null
    case 'type':
      return issue.type ?? null
    case 'status':
      return STATUS_RANK[issue.status] ?? null
    case 'priority':
      return PRIORITY_RANK[issue.priority] ?? null
    case 'assignee':
      return issue.assignee ? issue.assignee.name.toLowerCase() : null
    case 'points':
      return pointsValue(issue.storyPoints)
    case 'updated': {
      const t = new Date(issue.updatedAt).getTime()
      return isNaN(t) ? null : t
    }
  }
}

interface HeaderCellProps {
  label: string
  sortKey: SortKey
  activeKey: SortKey | null
  dir: SortDir
  span: string
  onToggle: (key: SortKey) => void
}

const HeaderCell = ({ label, sortKey, activeKey, dir, span, onToggle }: HeaderCellProps) => {
  const active = activeKey === sortKey
  return (
    <div className={span}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={`inline-flex items-center gap-1 text-sm font-medium hover:text-blue-600 focus:outline-none focus:text-blue-600 ${
          active ? 'text-blue-600' : 'text-gray-700'
        }`}
      >
        <span>{label}</span>
        <span className="text-xs w-3 inline-block" aria-hidden="true">
          {active ? (dir === 'asc' ? '▲' : '▼') : ''}
        </span>
      </button>
    </div>
  )
}

export const IssuesList = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects, loading: projectsLoading } = useProjects()
  const currentProject = projects.find(p => p.id === Number(projectId))

  const {
    issues,
    loading: issuesLoading,
    updateIssue
  } = useIssues(currentProject?.id)

  const [filters, setFilters] = useState({
    status: '' as IssueStatus | '',
    priority: '' as IssuePriority | '',
    type: '' as IssueType | '',
    assignee: '',
    search: ''
  })

  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)

  const updateFilters = (patch: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...patch }))
    setPage(1)
  }

  // Three-state cycle per column: asc -> desc -> none
  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey(null)
      setSortDir('asc')
    }
    setPage(1)
  }

  const filteredAndSortedIssues = useMemo(() => {
    const filtered = issues.filter(issue => {
      if (filters.status && issue.status !== filters.status) return false
      if (filters.priority && issue.priority !== filters.priority) return false
      if (filters.type && issue.type !== filters.type) return false
      if (filters.assignee && (!issue.assignee || !issue.assignee.name.toLowerCase().includes(filters.assignee.toLowerCase()))) return false
      if (filters.search && !issue.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !issue.description?.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })

    if (!sortKey) return filtered

    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey)
      const bv = sortValue(b, sortKey)
      // null/undefined always last, regardless of direction
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      const cmp = typeof av === 'string'
        ? av.localeCompare(bv as string)
        : (av as number) - (bv as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [issues, filters, sortKey, sortDir])

  const totalIssues = filteredAndSortedIssues.length
  const totalPages = Math.max(1, Math.ceil(totalIssues / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const pageIssues = filteredAndSortedIssues.slice(startIndex, startIndex + PAGE_SIZE)
  const showingFrom = totalIssues === 0 ? 0 : startIndex + 1
  const showingTo = Math.min(startIndex + PAGE_SIZE, totalIssues)

  // Compact page number list: 1 … around current … last
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = []
    let last = 0
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
        if (last && p - last > 1) pages.push('ellipsis')
        pages.push(p)
        last = p
      }
    }
    return pages
  }, [currentPage, totalPages])

  const handleQuickStatusChange = async (issueId: number, status: IssueStatus) => {
    try {
      await updateIssue(issueId, { status })
    } catch (error) {
      console.error('Failed to update issue status:', error)
    }
  }

  const statusConfig = {
    todo: { color: 'bg-gray-100 text-gray-800', label: 'To Do' },
    in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
    code_review: { color: 'bg-purple-100 text-purple-800', label: 'Code Review' },
    done: { color: 'bg-green-100 text-green-800', label: 'Done' },
  }

  const priorityConfig = {
    low: { color: 'text-green-600', icon: '↓' },
    medium: { color: 'text-yellow-600', icon: '→' },
    high: { color: 'text-orange-600', icon: '↑' },
    urgent: { color: 'text-red-600', icon: '⇈' },
  }

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (projectsLoading || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
          <Link to={`/projects/${projectId}/issues/create`}>
            <Button>Create Issue</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Search:</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search issues..."
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value as IssueStatus | '' })}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="code_review">Code Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Priority:</label>
            <select
              value={filters.priority}
              onChange={(e) => updateFilters({ priority: e.target.value as IssuePriority | '' })}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={filters.type}
              onChange={(e) => updateFilters({ type: e.target.value as IssueType | '' })}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="story">Story</option>
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="epic">Epic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <main className="flex-1 px-6 py-6">
        {issuesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading issues...</p>
            </div>
          </div>
        ) : totalIssues === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {issues.length === 0 ? 'No issues found for this project.' : 'No issues match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50">
                <HeaderCell label="Type" sortKey="type" activeKey={sortKey} dir={sortDir} span="col-span-1" onToggle={toggleSort} />
                <div className="col-span-1 text-sm font-medium text-gray-700">ID</div>
                <HeaderCell label="Title" sortKey="title" activeKey={sortKey} dir={sortDir} span="col-span-3" onToggle={toggleSort} />
                <HeaderCell label="Points" sortKey="points" activeKey={sortKey} dir={sortDir} span="col-span-1" onToggle={toggleSort} />
                <HeaderCell label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} span="col-span-2" onToggle={toggleSort} />
                <HeaderCell label="Priority" sortKey="priority" activeKey={sortKey} dir={sortDir} span="col-span-1" onToggle={toggleSort} />
                <HeaderCell label="Assignee" sortKey="assignee" activeKey={sortKey} dir={sortDir} span="col-span-2" onToggle={toggleSort} />
                <HeaderCell label="Updated" sortKey="updated" activeKey={sortKey} dir={sortDir} span="col-span-1" onToggle={toggleSort} />
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-200">
                {pageIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Type */}
                    <div className="col-span-1 flex items-center">
                      <IssueTypeIcon type={issue.type} />
                    </div>

                    {/* ID */}
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm font-medium text-gray-500">
                        {currentProject.key}-{issue.id}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="col-span-3 flex items-center">
                      <Link
                        to={`/projects/${projectId}/issues/${issue.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                      >
                        {issue.title}
                      </Link>
                    </div>

                    {/* Story Points */}
                    <div className="col-span-1 flex items-center">
                      {(issue.storyPoints !== null && issue.storyPoints !== undefined && issue.storyPoints !== '' && issue.storyPoints !== 0) ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                          {issue.storyPoints}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1 py-1 text-xs font-medium text-gray-400">
                          —
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex items-center">
                      <select
                        value={issue.status}
                        onChange={(e) => handleQuickStatusChange(issue.id, e.target.value as IssueStatus)}
                        className={`text-xs font-medium px-2 py-1 rounded border-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusConfig[issue.status].color}`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="code_review">Code Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div className="col-span-1 flex items-center">
                      <span className={`text-sm font-bold ${priorityConfig[issue.priority].color}`}>
                        {priorityConfig[issue.priority].icon}
                      </span>
                    </div>

                    {/* Assignee */}
                    <div className="col-span-2 flex items-center">
                      {issue.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {issue.assignee.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700 truncate">
                            {issue.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </div>

                    {/* Updated */}
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm text-gray-500">
                        {formatDate(issue.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>

            {/* Pagination footer */}
            <div
              data-testid="pagination-bar"
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg"
            >
                <span className="text-sm text-gray-600">
                  Showing {showingFrom}–{showingTo} of {totalIssues}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  {pageNumbers.map((p, i) =>
                    p === 'ellipsis' ? (
                      <span key={`e-${i}`} className="px-1 text-sm text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        aria-current={p === currentPage ? 'page' : undefined}
                        className={`px-3 py-1 text-sm border rounded ${
                          p === currentPage
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
          </div>
        )}
      </main>
    </div>
  )
}
