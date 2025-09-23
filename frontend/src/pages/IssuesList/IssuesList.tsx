import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { useIssues } from '../../hooks/useIssues'
import { Button } from '../../components/ui/Button'
import type { Issue, IssueStatus, IssuePriority, IssueType } from '../../types/domain.types'

export const IssuesList = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
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

  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'priority' | 'status'>('updated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredAndSortedIssues = issues
    .filter(issue => {
      if (filters.status && issue.status !== filters.status) return false
      if (filters.priority && issue.priority !== filters.priority) return false
      if (filters.type && issue.type !== filters.type) return false
      if (filters.assignee && (!issue.assignee || !issue.assignee.name.toLowerCase().includes(filters.assignee.toLowerCase()))) return false
      if (filters.search && !issue.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !issue.description?.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case 'created':
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
          break
        case 'updated':
          aVal = new Date(a.updatedAt).getTime()
          bVal = new Date(b.updatedAt).getTime()
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          aVal = priorityOrder[a.priority]
          bVal = priorityOrder[b.priority]
          break
        case 'status':
          const statusOrder = { todo: 1, in_progress: 2, code_review: 3, done: 4 }
          aVal = statusOrder[a.status]
          bVal = statusOrder[b.status]
          break
        default:
          return 0
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

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

  const typeConfig = {
    story: { color: 'bg-green-100 text-green-800', icon: '📖' },
    task: { color: 'bg-blue-100 text-blue-800', icon: '✓' },
    bug: { color: 'bg-red-100 text-red-800', icon: '🐛' },
    epic: { color: 'bg-purple-100 text-purple-800', icon: '⚡' },
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
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search issues..."
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as IssueStatus | '' })}
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
              onChange={(e) => setFilters({ ...filters, priority: e.target.value as IssuePriority | '' })}
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
              onChange={(e) => setFilters({ ...filters, type: e.target.value as IssueType | '' })}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="story">Story</option>
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="epic">Epic</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Created</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
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
        ) : filteredAndSortedIssues.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {issues.length === 0 ? 'No issues found for this project.' : 'No issues match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
              <div className="col-span-1">Type</div>
              <div className="col-span-1">ID</div>
              <div className="col-span-4">Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-2">Assignee</div>
              <div className="col-span-1">Updated</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-200">
              {filteredAndSortedIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Type */}
                  <div className="col-span-1 flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${typeConfig[issue.type].color}`}>
                      {typeConfig[issue.type].icon}
                    </span>
                  </div>

                  {/* ID */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-sm font-medium text-gray-500">
                      {currentProject.key}-{issue.id}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="col-span-4 flex items-center">
                    <Link
                      to={`/projects/${projectId}/issues/${issue.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                    >
                      {issue.title}
                    </Link>
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
        )}
      </main>
    </div>
  )
}