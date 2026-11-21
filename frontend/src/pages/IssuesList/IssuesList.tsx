import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { useIssues } from '../../hooks/useIssues'
import { Pagination } from '../../components/Pagination/Pagination'
import { paginate } from '../../utils/pagination'
import { IssuesSkeleton } from '../../components/IssuesSkeleton/IssuesSkeleton'
import { Button } from '../../components/ui/Button'
import { IssueTypeIcon } from '../../components/IssueTypeIcon'
import type { Issue, IssueStatus, IssuePriority, IssueType } from '../../types/domain.types'

const PAGE_SIZE = 25

type SortKey = 'title' | 'type' | 'status' | 'priority' | 'assignee' | 'points' | 'updated'
type SortDir = 'asc' | 'desc'

const SORT_LABELS: Record<SortKey, string> = {
  type: 'Type',
  title: 'Title',
  points: 'Points',
  status: 'Status',
  priority: 'Priority',
  assignee: 'Assignee',
  updated: 'Updated',
}

const FILTER_FIELD = 'flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-2'
const FILTER_LABEL = 'text-xs font-medium text-gray-700 md:text-sm'
const FILTER_CONTROL = 'min-w-0 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-md:min-h-11 max-md:w-full'

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

  const setSort = (key: SortKey | null, dir: SortDir) => {
    setSortKey(key)
    setSortDir(dir)
    setPage(1)
  }

  // Three-state cycle per column: asc -> desc -> none
  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) setSort(key, 'asc')
    else if (sortDir === 'asc') setSort(key, 'desc')
    else setSort(null, 'asc')
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

  const {
    items: pageIssues,
    page: currentPage,
    pageCount,
    start: showingFrom,
    end: showingTo,
    total: totalIssues,
  } = paginate(filteredAndSortedIssues, page, PAGE_SIZE)

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
    low: { color: 'text-gray-500', icon: '↓' },
    medium: { color: 'text-gray-600', icon: '→' },
    high: { color: 'text-gray-900', icon: '↑' },
    urgent: { color: 'text-red-600', icon: '⇈' },
  }

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const renderStatusSelect = (issue: Issue, className = '') => (
    <select
      aria-label="Status"
      value={issue.status}
      onChange={(e) => handleQuickStatusChange(issue.id, e.target.value as IssueStatus)}
      className={`text-xs font-medium px-2 py-1 rounded border-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusConfig[issue.status].color} ${className}`}
    >
      <option value="todo">To Do</option>
      <option value="in_progress">In Progress</option>
      <option value="code_review">Code Review</option>
      <option value="done">Done</option>
    </select>
  )

  if (projectsLoading || !currentProject) {
    return (
      <div className="flex-1 min-w-0 bg-gray-50 px-4 py-4 md:px-6 md:py-6">
        <IssuesSkeleton />
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Issues</h1>
            <p className="mt-1 text-sm text-gray-500">Every issue in this project. Filter, sort and open any of them.</p>
          </div>
          <Link to={`/projects/${projectId}/issues/create`}>
            <Button className="max-md:min-h-11">Create Issue</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-center md:gap-4">
          <div className={`col-span-2 ${FILTER_FIELD}`}>
            <label htmlFor="issues-filter-search" className={FILTER_LABEL}>Search<span className="hidden md:inline">:</span></label>
            <input
              id="issues-filter-search"
              type="text"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search issues..."
              className={FILTER_CONTROL}
            />
          </div>

          <div className={FILTER_FIELD}>
            <label htmlFor="issues-filter-status" className={FILTER_LABEL}>Status<span className="hidden md:inline">:</span></label>
            <select
              id="issues-filter-status"
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value as IssueStatus | '' })}
              className={FILTER_CONTROL}
            >
              <option value="">All</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="code_review">Code Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className={FILTER_FIELD}>
            <label htmlFor="issues-filter-priority" className={FILTER_LABEL}>Priority<span className="hidden md:inline">:</span></label>
            <select
              id="issues-filter-priority"
              value={filters.priority}
              onChange={(e) => updateFilters({ priority: e.target.value as IssuePriority | '' })}
              className={FILTER_CONTROL}
            >
              <option value="">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className={FILTER_FIELD}>
            <label htmlFor="issues-filter-type" className={FILTER_LABEL}>Type<span className="hidden md:inline">:</span></label>
            <select
              id="issues-filter-type"
              value={filters.type}
              onChange={(e) => updateFilters({ type: e.target.value as IssueType | '' })}
              className={FILTER_CONTROL}
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
      <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
        {issuesLoading ? (
          <IssuesSkeleton />
        ) : totalIssues === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {issues.length === 0 ? 'No issues found for this project.' : 'No issues match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="xl:rounded-lg xl:bg-white xl:shadow">
            <div className="mb-3 flex items-center gap-2 xl:hidden">
              <label htmlFor="issues-sort" className={`shrink-0 ${FILTER_LABEL}`}>Sort by</label>
              <select
                id="issues-sort"
                value={sortKey ?? ''}
                onChange={(e) => setSort((e.target.value || null) as SortKey | null, sortDir)}
                className={`flex-1 md:flex-none ${FILTER_CONTROL}`}
              >
                <option value="">None</option>
                {Object.entries(SORT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Toggle sort direction"
                onClick={() => setSort(sortKey, sortDir === 'asc' ? 'desc' : 'asc')}
                className="shrink-0 rounded border border-gray-300 bg-white px-3 py-1 text-sm max-md:min-h-11 max-md:min-w-11"
              >
                {sortDir === 'asc' ? '▲' : '▼'}
              </button>
            </div>

            <ul className="space-y-3 xl:hidden">
              {pageIssues.map((issue) => (
                <li key={issue.id} data-testid={`issue-card-${issue.id}`} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="shrink-0"><IssueTypeIcon type={issue.type} /></span>
                    <span className="min-w-0 truncate font-medium">{currentProject.key}-{issue.id}</span>
                    <span aria-label={`${issue.priority} priority`} className={`shrink-0 font-bold ${priorityConfig[issue.priority].color}`}>
                      {priorityConfig[issue.priority].icon}
                    </span>
                    <time className="ml-auto shrink-0 text-xs">{formatDate(issue.updatedAt)}</time>
                  </div>
                  <Link
                    to={`/projects/${projectId}/issues/${issue.id}`}
                    className="my-2 flex items-center text-sm font-medium text-gray-900 hover:text-blue-600 max-md:min-h-11"
                  >
                    <span className="line-clamp-2 min-w-0 wrap-anywhere">{issue.title}</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    {renderStatusSelect(issue, 'min-w-0 max-w-1/2 max-md:min-h-11')}
                    {issue.storyPoints != null && issue.storyPoints !== '' && issue.storyPoints !== 0 && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {issue.storyPoints}
                      </span>
                    )}
                    <div className="ml-auto flex min-w-0 items-center gap-2 text-sm">
                      {issue.assignee ? (
                        <>
                          <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                            {issue.assignee.name.charAt(0)}
                          </span>
                          <span className="truncate text-gray-700">{issue.assignee.name}</span>
                        </>
                      ) : (
                        <span className="truncate text-gray-400">Unassigned</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto xl:block">
              <div className="min-w-[900px]">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50">
                <HeaderCell label={SORT_LABELS.type} sortKey="type" activeKey={sortKey} dir={sortDir} span="col-span-1" onToggle={toggleSort} />
                <div className="col-span-1 text-sm font-medium text-gray-700">ID</div>
                <HeaderCell label={SORT_LABELS.title} sortKey="title" activeKey={sortKey} dir={sortDir} span="col-span-3" onToggle={toggleSort} />
                <HeaderCell label={SORT_LABELS.points} sortKey="points" activeKey={sortKey} dir={sortDir} span="col-span-1" onToggle={toggleSort} />
                <HeaderCell label={SORT_LABELS.status} sortKey="status" activeKey={sortKey} dir={sortDir} span="col-span-2" onToggle={toggleSort} />
                <HeaderCell label={SORT_LABELS.priority} sortKey="priority" activeKey={sortKey} dir={sortDir} span="col-span-1" onToggle={toggleSort} />
                <HeaderCell label={SORT_LABELS.assignee} sortKey="assignee" activeKey={sortKey} dir={sortDir} span="col-span-2" onToggle={toggleSort} />
                <HeaderCell label={SORT_LABELS.updated} sortKey="updated" activeKey={sortKey} dir={sortDir} span="col-span-1" onToggle={toggleSort} />
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
                      {renderStatusSelect(issue)}
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
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-800">
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-b-lg border-t border-gray-200 bg-gray-50 px-4 py-3 md:px-6 max-xl:mt-3"
            >
              <span className="text-sm text-gray-600">
                Showing {showingFrom}–{showingTo} of {totalIssues} issues
              </span>
              <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
