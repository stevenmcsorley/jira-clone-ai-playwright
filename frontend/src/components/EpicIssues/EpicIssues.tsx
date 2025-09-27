import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { IssueLinksService } from '../../services/api/issue-links.service'
import { useProjects } from '../../hooks/useProjects'
import type { Issue, IssueStatus } from '../../types/domain.types'

interface EpicIssuesProps {
  epic: Issue
  projectId: string
  onIssueUpdate?: (issueId: number, updates: Partial<Issue>) => void
}

export const EpicIssues = ({ epic, projectId, onIssueUpdate }: EpicIssuesProps) => {
  const { projects } = useProjects()
  const currentProject = projects.find(p => p.id === Number(projectId))
  const epicIssues = useMemo(() => epic.epicIssues || [], [epic.epicIssues])
  const [showAddIssue, setShowAddIssue] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Issue[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [adding, setAdding] = useState(false)

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

  const getProgress = () => {
    if (epicIssues.length === 0) return { completed: 0, total: 0, percentage: 0 }
    const completed = epicIssues.filter(issue => issue.status === 'done').length
    const total = epicIssues.length
    const percentage = Math.round((completed / total) * 100)
    return { completed, total, percentage }
  }

  const handleQuickStatusChange = async (issueId: number, status: IssueStatus) => {
    if (onIssueUpdate) {
      try {
        await onIssueUpdate(issueId, { status })
      } catch (error) {
        console.error('Failed to update issue status:', error)
      }
    }
  }

  const handleRemoveFromEpic = async (issueId: number) => {
    if (onIssueUpdate) {
      try {
        await onIssueUpdate(issueId, { epicId: undefined })
      } catch (error) {
        console.error('Failed to remove issue from epic:', error)
      }
    }
  }


  // Handle search for issues to add to epic
  useEffect(() => {
    const searchIssues = async () => {
      // Allow shorter queries for numeric searches (issue IDs)
      const isNumericQuery = /^\d+$/.test(searchQuery.trim()) || /^jc-?\d+$/i.test(searchQuery.trim())
      const minLength = isNumericQuery ? 1 : 3

      if (searchQuery.length >= minLength) {
        try {
          const results = await IssueLinksService.searchIssues(searchQuery, parseInt(projectId))
          // Filter out the current epic and already linked issues
          const linkedIssueIds = new Set([
            epic.id,
            ...epicIssues.map(issue => issue.id)
          ])
          const filteredResults = results.filter(result =>
            !linkedIssueIds.has(result.id) && result.type !== 'epic'
          )
          setSearchResults(filteredResults)
          setShowSearchResults(true)
        } catch (error) {
          console.error('Failed to search issues:', error)
          setSearchResults([])
        }
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }

    const timeoutId = setTimeout(searchIssues, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [searchQuery, epic.id, epicIssues, projectId])

  const handleSelectIssue = (selectedIssue: Issue) => {
    setSelectedIssue(selectedIssue)
    setSearchQuery(selectedIssue.title)
    setShowSearchResults(false)
  }

  const handleAddIssueToEpic = async () => {
    if (!selectedIssue || !onIssueUpdate || adding) return

    try {
      setAdding(true)
      await onIssueUpdate(selectedIssue.id, { epicId: epic.id })

      // Reset form
      setSearchQuery('')
      setSelectedIssue(null)
      setShowSearchResults(false)
      setShowAddIssue(false)
    } catch (error) {
      console.error('Failed to add issue to epic:', error)
    } finally {
      setAdding(false)
    }
  }

  const progress = getProgress()

  if (epic.type !== 'epic') {
    return null
  }

  return (
    <div className="bg-white border-t border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-6 pt-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <span className="text-purple-600">⚡</span>
            Epic Issues
          </h3>
          {epicIssues.length > 0 && (
            <div className="flex items-center gap-3 ml-4">
              <div className="text-sm text-gray-600">
                {progress.completed}/{progress.total} completed
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="text-sm font-medium text-gray-700">
                {progress.percentage}%
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAddIssue(!showAddIssue)}
          >
            Add Issue
          </Button>
          <Link to={`/projects/${projectId}/issues/create?epic=${epic.id}`}>
            <Button size="sm">Create Issue</Button>
          </Link>
        </div>
      </div>

      {/* Add Issue Controls */}
      {showAddIssue && (
        <div className="mb-6 mx-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-3">Add existing issues to this epic:</p>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedIssue(null)
                }}
                placeholder="Type to search for issues..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((searchIssue) => (
                    <button
                      key={searchIssue.id}
                      type="button"
                      onClick={() => handleSelectIssue(searchIssue)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {searchIssue.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {currentProject?.key || 'JC'}-{searchIssue.id} • {searchIssue.type} • {searchIssue.status.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          searchIssue.type === 'bug' ? 'bg-red-100 text-red-800' :
                          searchIssue.type === 'story' ? 'bg-green-100 text-green-800' :
                          searchIssue.type === 'epic' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {searchIssue.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length > 0 && searchQuery.length < 3 && !/^\d+$/.test(searchQuery.trim()) && !/^jc-?\d+$/i.test(searchQuery.trim()) && (
                <div className="text-xs text-gray-500 mt-1">
                  Type at least 3 characters to search (or use issue ID/key)
                </div>
              )}

              {selectedIssue && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm font-medium text-blue-900">
                    Selected: {selectedIssue.title}
                  </div>
                  <div className="text-xs text-blue-700">
                    {currentProject?.key || 'JC'}-{selectedIssue.id} • {selectedIssue.type}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleAddIssueToEpic}
                size="sm"
                disabled={!selectedIssue || adding}
              >
                {adding ? 'Adding...' : 'Add to Epic'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAddIssue(false)
                  setSearchQuery('')
                  setSelectedIssue(null)
                  setShowSearchResults(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {epicIssues.length === 0 ? (
        <div className="text-center py-12 text-gray-500 mx-6">
          <div className="mb-4">
            <span className="text-4xl">📋</span>
          </div>
          <p className="text-sm">No issues linked to this epic yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Create new issues or add existing ones to track epic progress.
          </p>
        </div>
      ) : (
        <>
          {/* Issues Table - Full Width, Same as Issues Page */}
          <div className="bg-white shadow overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
              <div className="col-span-1">Type</div>
              <div className="col-span-1">ID</div>
              <div className="col-span-4">Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-2">Assignee</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-200">
              {epicIssues.map((issue) => (
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
                      {currentProject?.key || 'JC'}-{issue.id}
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

                  {/* Actions */}
                  <div className="col-span-1 flex items-center">
                    <button
                      onClick={() => handleRemoveFromEpic(issue.id)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Epic Summary Stats */}
          <div className="mt-6 mx-6 pt-4 border-t border-gray-200 pb-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-gray-800">{epicIssues.length}</div>
                <div className="text-xs text-gray-600">Total Issues</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">
                  {epicIssues.filter(i => i.status === 'in_progress').length}
                </div>
                <div className="text-xs text-gray-600">In Progress</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">
                  {progress.completed}
                </div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-600">
                  {epicIssues.reduce((sum, issue) => sum + (issue.estimate || 0), 0)}h
                </div>
                <div className="text-xs text-gray-600">Total Estimate</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}