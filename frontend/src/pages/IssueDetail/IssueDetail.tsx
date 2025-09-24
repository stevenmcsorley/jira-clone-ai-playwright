import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Comments } from '../../components/Comments/Comments'
import { Attachments } from '../../components/Attachments/Attachments'
import { Subtasks } from '../../components/Subtasks/Subtasks'
import { TimeTracking } from '../../components/TimeTracking/TimeTracking'
import { EpicIssues } from '../../components/EpicIssues/EpicIssues'
import { IssueLinks } from '../../components/IssueLinks/IssueLinks'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import { IssuesService } from '../../services/api/issues.service'
import type { Issue, UpdateIssueRequest, IssueStatus, IssuePriority, IssueType } from '../../types/domain.types'

export const IssueDetail = () => {
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>()
  const navigate = useNavigate()
  const { projects } = useProjects()
  const { users } = useUsers()

  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const currentProject = projects.find(p => p.id === Number(projectId))

  useEffect(() => {
    const fetchIssue = async () => {
      if (!issueId) return

      try {
        setLoading(true)
        const issueData = await IssuesService.getById(Number(issueId))
        setIssue(issueData)
      } catch (err) {
        setError('Failed to load issue')
        console.error('Error fetching issue:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchIssue()
  }, [issueId])

  const handleUpdate = async (updates: UpdateIssueRequest) => {
    if (!issue) return

    try {
      setSaving(true)
      const updatedIssue = await IssuesService.update(issue.id, updates)
      setIssue(updatedIssue)
    } catch (err) {
      console.error('Error updating issue:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = (status: IssueStatus) => {
    handleUpdate({ status })
  }

  const handlePriorityChange = (priority: IssuePriority) => {
    handleUpdate({ priority })
  }

  const handleAssigneeChange = (assigneeId: number | undefined) => {
    handleUpdate({ assigneeId })
  }

  const priorityIcons = {
    low: { icon: '↓', color: 'text-green-600', bg: 'bg-green-50' },
    medium: { icon: '→', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    high: { icon: '↑', color: 'text-orange-600', bg: 'bg-orange-50' },
    urgent: { icon: '⇈', color: 'text-red-600', bg: 'bg-red-50' },
  }

  const statusOptions: { value: IssueStatus; label: string }[] = [
    { value: 'todo', label: 'TO DO' },
    { value: 'in_progress', label: 'IN PROGRESS' },
    { value: 'code_review', label: 'CODE REVIEW' },
    { value: 'done', label: 'DONE' },
  ]

  const priorityOptions: { value: IssuePriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading issue...</p>
        </div>
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Issue not found'}</p>
          <Button onClick={() => navigate(`/projects/${projectId}`)}>
            Back to Board
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">
              {currentProject?.key || 'TIS'}-{issue.id}
            </span>
            <div className={`w-6 h-6 flex items-center justify-center rounded ${priorityIcons[issue.priority].bg}`}>
              <span className={`text-sm font-bold ${priorityIcons[issue.priority].color}`}>
                {priorityIcons[issue.priority].icon}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/projects/${projectId}/issues/${issueId}/edit`}>
              <Button variant="secondary">
                Edit
              </Button>
            </Link>
            <Button
              onClick={() => navigate(`/projects/${projectId}`)}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-full mx-auto">
        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {issue.title}
              </h1>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {issue.description || 'No description provided.'}
              </div>
            </div>

            {/* Labels */}
            {issue.labels && issue.labels.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {issue.labels.map((label, index) => (
                    <span
                      key={index}
                      className="text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Time Tracking */}
            <TimeTracking issueId={issue.id} originalEstimate={issue.estimate} />

            {/* Subtasks */}
            <Subtasks issueId={issue.id} />

            {/* Issue Links */}
            <IssueLinks
              issue={issue}
              projectId={projectId!}
            />

            {/* Attachments */}
            <Attachments issueId={issue.id} />

            {/* Comments & Activity */}
            <Comments issueId={issue.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
              <select
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Priority</h4>
              <select
                value={issue.priority}
                onChange={(e) => handlePriorityChange(e.target.value as IssuePriority)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Assignee</h4>
              <select
                value={issue.assigneeId || ''}
                onChange={(e) => handleAssigneeChange(e.target.value ? Number(e.target.value) : undefined)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {issue.assignee && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {issue.assignee.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{issue.assignee.name}</span>
                </div>
              )}
            </div>

            {/* Reporter */}
            {issue.reporter && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Reporter</h4>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {issue.reporter.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{issue.reporter.name}</span>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Dates</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(issue.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{' '}
                  {new Date(issue.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Epic Issues - Full Width Section for Epic type issues */}
        {issue.type === 'epic' && (
          <div className="mt-8">
            <EpicIssues
              epic={issue}
              projectId={projectId!}
              onIssueUpdate={async (issueId, updates) => {
                try {
                  await IssuesService.update(issueId, updates)
                  // Refresh the epic to get updated linked issues
                  const updatedIssue = await IssuesService.getById(issue.id)
                  setIssue(updatedIssue)
                } catch (error) {
                  console.error('Failed to update issue:', error)
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}