import { useState, useEffect, useCallback } from 'react'
import { SubtasksService, type Subtask, type CreateSubtaskRequest, type UpdateSubtaskRequest, type SubtaskProgress } from '../../services/api/subtasks.service'
import { useUsers } from '../../hooks/useUsers'
import { Button } from '../ui/Button'
import type { IssueStatus } from '../../types/domain.types'

interface SubtasksProps {
  issueId: number
}

export const Subtasks = ({ issueId }: SubtasksProps) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [progress, setProgress] = useState<SubtaskProgress>({ completed: 0, total: 0, percentage: 0 })
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    description: '',
    assigneeId: undefined as number | undefined,
  })
  const [editingSubtask, setEditingSubtask] = useState<number | null>(null)
  const [_editFormData, _setEditFormData] = useState<UpdateSubtaskRequest>({})
  const [submitting, setSubmitting] = useState(false)

  const { users } = useUsers()

  const fetchSubtasks = useCallback(async () => {
    try {
      setLoading(true)
      const data = await SubtasksService.getByIssue(issueId)
      setSubtasks(data)
    } catch (error) {
      console.error('Error fetching subtasks:', error)
    } finally {
      setLoading(false)
    }
  }, [issueId])

  const fetchProgress = useCallback(async () => {
    try {
      const data = await SubtasksService.getProgress(issueId)
      setProgress(data)
    } catch (error) {
      console.error('Error fetching progress:', error)
    }
  }, [issueId])

  useEffect(() => {
    fetchSubtasks()
    fetchProgress()
  }, [fetchSubtasks, fetchProgress])

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtask.title.trim() || submitting) return

    try {
      setSubmitting(true)
      const subtaskData: CreateSubtaskRequest = {
        title: newSubtask.title,
        description: newSubtask.description || undefined,
        parentIssueId: issueId,
        assigneeId: newSubtask.assigneeId,
      }
      await SubtasksService.create(subtaskData)
      setNewSubtask({ title: '', description: '', assigneeId: undefined })
      setShowCreateForm(false)
      await fetchSubtasks()
      await fetchProgress()
    } catch (error) {
      console.error('Error creating subtask:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSubtask = async (subtaskId: number, updates: UpdateSubtaskRequest) => {
    try {
      setSubmitting(true)
      await SubtasksService.update(subtaskId, updates)
      await fetchSubtasks()
      await fetchProgress()
    } catch (error) {
      console.error('Error updating subtask:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!confirm('Are you sure you want to delete this subtask?')) return

    try {
      await SubtasksService.deleteSubtask(subtaskId)
      await fetchSubtasks()
      await fetchProgress()
    } catch (error) {
      console.error('Error deleting subtask:', error)
    }
  }

  const handleStatusChange = (subtaskId: number, status: IssueStatus) => {
    handleUpdateSubtask(subtaskId, { status })
  }

  const statusOptions: { value: IssueStatus; label: string; color: string }[] = [
    { value: 'todo', label: 'TO DO', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'IN PROGRESS', color: 'bg-blue-100 text-blue-800' },
    { value: 'code_review', label: 'CODE REVIEW', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'done', label: 'DONE', color: 'bg-green-100 text-green-800' },
  ]

  const getStatusOption = (status: IssueStatus) => statusOptions.find(option => option.value === status)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Subtasks ({subtasks.length})
          </h3>
          {progress.total > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">
                {progress.completed}/{progress.total} completed ({progress.percentage}%)
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          size="sm"
        >
          Add Subtask
        </Button>
      </div>

      {/* Create Subtask Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateSubtask} className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={newSubtask.title}
                onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter subtask title..."
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={newSubtask.description}
                onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Enter subtask description..."
              />
            </div>
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <select
                id="assignee"
                value={newSubtask.assigneeId || ''}
                onChange={(e) => setNewSubtask({ ...newSubtask, assigneeId: e.target.value ? Number(e.target.value) : undefined })}
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
          <div className="flex items-center gap-2 mt-4">
            <Button
              type="submit"
              disabled={submitting || !newSubtask.title.trim()}
              size="sm"
            >
              Create Subtask
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                setNewSubtask({ title: '', description: '', assigneeId: undefined })
              }}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Subtasks List */}
      <div className="space-y-3">
        {subtasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No subtasks yet</p>
        ) : (
          subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{subtask.title}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        getStatusOption(subtask.status)?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {getStatusOption(subtask.status)?.label || subtask.status}
                    </span>
                  </div>
                  {subtask.description && (
                    <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">
                      {subtask.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {subtask.assignee && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {subtask.assignee.name.charAt(0)}
                          </span>
                        </div>
                        <span>{subtask.assignee.name}</span>
                      </div>
                    )}
                    {subtask.estimate && (
                      <span>Estimate: {subtask.estimate}h</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={subtask.status}
                    onChange={(e) => handleStatusChange(subtask.id, e.target.value as IssueStatus)}
                    disabled={submitting}
                    className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    variant="secondary"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}