import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import { useIssues } from '../../hooks/useIssues'
import type { IssueStatus, IssuePriority, IssueType } from '../../types/domain.types'

export const CreateIssue = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects } = useProjects()
  const { users } = useUsers()

  const currentProject = projects.find(p => p.id === Number(projectId))
  const { createIssue } = useIssues(currentProject?.id)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>('todo')
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [type, setType] = useState<IssueType>('task')
  const [assigneeId, setAssigneeId] = useState<number | undefined>()
  const [labels, setLabels] = useState<string[]>([])
  const [estimate, setEstimate] = useState<number | undefined>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProject) return

    const issueData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      type,
      assigneeId,
      labels: labels.length > 0 ? labels : undefined,
      estimate,
      projectId: currentProject.id,
      reporterId: 1, // TODO: Get current user ID
    }

    try {
      setSaving(true)
      setError(null)
      const newIssue = await createIssue(issueData)
      navigate(`/projects/${projectId}/issues/${newIssue.id}`)
    } catch (err) {
      console.error('Error creating issue:', err)
      setError('Failed to create issue')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate(`/projects/${projectId}`)
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

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Project not found</p>
          <Button onClick={() => navigate('/')}>
            Back to Projects
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
          <h1 className="text-2xl font-bold text-gray-900">
            Create Issue
          </h1>
          <div className="flex items-center gap-3">
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
              form="create-issue-form"
              disabled={saving || !title.trim()}
            >
              {saving ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form id="create-issue-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter issue title..."
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter issue description..."
            />
          </div>

          {/* Issue Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as IssueType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-2">
                Assignee
              </label>
              <select
                id="assignee"
                value={assigneeId || ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Labels
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {labels.map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(label)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add a label and press Enter..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddLabel(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>

          {/* Estimate */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label htmlFor="estimate" className="block text-sm font-medium text-gray-700 mb-2">
              Story Points / Estimate
            </label>
            <input
              type="number"
              id="estimate"
              value={estimate || ''}
              onChange={(e) => setEstimate(e.target.value ? Number(e.target.value) : undefined)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter story points..."
            />
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}