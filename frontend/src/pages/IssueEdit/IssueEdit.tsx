import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FormActionBar } from '../../components/FormActionBar'
import { Button } from '../../components/ui/Button'
import { StoryPointInput, type EstimationScale } from '../../components/StoryPointInput/StoryPointInput'
import { TimeInput } from '../../components/ui/TimeInput/TimeInput'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import { IssuesService } from '../../services/api/issues.service'
import type { Issue, UpdateIssueRequest, IssueStatus, IssuePriority, IssueType } from '../../types/domain.types'

// The breadcrumb is rendered immediately before the page by Layout.
const mobileBreadcrumbClasses =
  'max-md:[nav[aria-label=Breadcrumb]:has(+_&)>ol]:min-w-0 ' +
  'max-md:[nav[aria-label=Breadcrumb]:has(+_&)>ol]:flex-wrap ' +
  'max-md:[nav[aria-label=Breadcrumb]:has(+_&)_li]:max-w-full'

export const IssueEdit = () => {
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>()
  const navigate = useNavigate()
  const { projects } = useProjects()
  const { users } = useUsers()

  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    }
  }, [error])

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>('todo')
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [type, setType] = useState<IssueType>('task')
  const [assigneeId, setAssigneeId] = useState<number | undefined>()
  const [labels, setLabels] = useState<string[]>([])
  const [timeEstimate, setTimeEstimate] = useState<number | undefined>()
  const [storyPoints, setStoryPoints] = useState<string | number | undefined>()
  const [estimationScale, setEstimationScale] = useState<EstimationScale>('fibonacci')

  const currentProject = projects.find(p => p.id === Number(projectId))

  useEffect(() => {
    const fetchIssue = async () => {
      if (!issueId) return

      try {
        setLoading(true)
        setError(null)
        const issueData = await IssuesService.getById(Number(issueId))
        setIssue(issueData)

        // Populate form fields
        setTitle(issueData.title)
        setDescription(issueData.description || '')
        setStatus(issueData.status)
        setPriority(issueData.priority)
        setType(issueData.type)
        setAssigneeId(issueData.assigneeId)
        setLabels(issueData.labels || [])
        setTimeEstimate(issueData.estimate)
        setStoryPoints(issueData.storyPoints)
      } catch (err) {
        setIssue(null)
        setError('Failed to load issue')
        console.error('Error fetching issue:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchIssue()
  }, [issueId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issue) return

    const updates: UpdateIssueRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      assigneeId,
      labels: labels.length > 0 ? labels : undefined,
      estimate: timeEstimate,
      storyPoints,
    }

    try {
      setSaving(true)
      setError(null)
      await IssuesService.update(issue.id, updates)
      navigate(`/projects/${projectId}/issues/${issueId}`)
    } catch (err) {
      console.error('Error updating issue:', err)
      setError('Failed to update issue')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate(`/projects/${projectId}/issues/${issueId}`)
  }

  const handleAddLabel = (label: string) => {
    if (label.trim() && !labels.includes(label.trim())) {
      setLabels([...labels, label.trim()])
    }
  }

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove))
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

  const typeOptions: { value: IssueType; label: string }[] = [
    { value: 'story', label: 'Story' },
    { value: 'task', label: 'Task' },
    { value: 'bug', label: 'Bug' },
    { value: 'epic', label: 'Epic' },
  ]

  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading issue"
        data-testid="issue-edit-loading"
        className={`flex-1 bg-gray-50 motion-safe:animate-pulse ${mobileBreadcrumbClasses}`}
      >
        <div aria-hidden="true" className="border-b border-gray-200 bg-white px-4 py-3 md:px-6 md:py-4">
          <div className="h-7 w-40 rounded bg-gray-200" />
        </div>
        <div aria-hidden="true" className="mx-auto max-w-4xl space-y-6 px-4 py-4 md:px-6 md:py-8">
          <div className="h-24 rounded-lg border border-gray-200 bg-gray-100" />
          <div className="h-48 rounded-lg border border-gray-200 bg-gray-100" />
          <div className="h-24 rounded-lg border border-gray-200 bg-gray-100" />
        </div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${mobileBreadcrumbClasses}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Issue not found'}</p>
          <Button className="max-md:min-h-11" onClick={() => navigate(`/projects/${projectId}`)}>
            Back to Board
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 flex flex-col bg-gray-50 ${mobileBreadcrumbClasses}`}>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <span className="min-w-0 wrap-anywhere text-xl font-bold text-gray-900">
            Edit Issue {currentProject?.key || 'TIS'}-{issue.id}
          </span>
          <div className="flex items-center gap-3 max-md:hidden">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="issue-edit-form"
              disabled={saving || !title.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-4 max-md:pb-24 md:px-6 md:py-8">
        <div className="max-w-4xl mx-auto">
        {error && (
          <div ref={errorRef} role="alert" className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form id="issue-edit-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-md:min-h-11 max-md:text-base"
              placeholder="Enter issue title..."
              required
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-md:min-h-11 max-md:text-base"
              placeholder="Enter issue description..."
            />
          </div>

          {/* Issue Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-md:min-h-11 max-md:text-base"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-md:min-h-11 max-md:text-base"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as IssueType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-md:min-h-11 max-md:text-base"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-2">
                Assignee
              </label>
              <select
                id="assignee"
                value={assigneeId || ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-md:min-h-11 max-md:text-base"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Labels
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {labels.map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium max-md:max-w-full"
                >
                  <span className="max-md:min-w-0 max-md:wrap-anywhere">{label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(label)}
                    className="text-orange-600 hover:text-orange-800 max-md:min-h-11"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add a label and press Enter..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-md:min-h-11 max-md:text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddLabel(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>

          {/* Time Estimation */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
            <TimeInput
              className="max-md:min-h-11 max-md:text-base"
              value={timeEstimate}
              onChange={setTimeEstimate}
              label="Time Estimate"
              placeholder="e.g., 2h 30m, 1.5h, 90m"
              helperText="Time tracking: Estimated time for budget and project management"
              disabled={saving}
            />
          </div>

          {/* Story Point Estimate */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 max-md:[&_select]:min-h-11 max-md:[&_select]:text-base">
            <StoryPointInput
              className="max-md:min-h-11 max-md:text-base"
              value={storyPoints}
              onChange={setStoryPoints}
              scale={estimationScale}
              onScaleChange={setEstimationScale}
              placeholder="Select story point estimate..."
              showScaleSelector={true}
              disabled={saving}
            />
            <div className="mt-2 text-xs text-gray-500">
              <strong>Story Points:</strong> Relative complexity for sprint planning - can be estimated during Planning Poker sessions
            </div>
          </div>
        </form>
        </div>
      </div>
      <FormActionBar
        formId="issue-edit-form"
        onCancel={handleCancel}
        submitLabel="Save Changes"
        savingLabel="Saving..."
        saving={saving}
        disabled={saving || !title.trim()}
      />
    </div>
  )
}
