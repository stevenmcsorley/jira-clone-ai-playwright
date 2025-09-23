import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Issue, IssueStatus } from '../../types/domain.types'
import { useIssueMetrics } from '../../hooks/useIssueMetrics'
import { TimeTrackingService } from '../../services/api/time-tracking.service'

interface SimpleKanbanProps {
  issues: Issue[]
  onIssueUpdate?: (issueId: number, updates: any) => void
  project: any
}

const SimpleIssueCard = ({ issue, onDragStart, onDragEnd, onUpdate, projectId }: {
  issue: Issue;
  onDragStart: (issue: Issue) => void;
  onDragEnd: () => void;
  onUpdate?: (issueId: number, updates: any) => void;
  projectId: string;
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editTitle, setEditTitle] = useState(issue.title)
  const [editDescription, setEditDescription] = useState(issue.description || '')
  const metrics = useIssueMetrics(issue.id)

  // Update local state when issue props change
  React.useEffect(() => {
    setEditTitle(issue.title)
    setEditDescription(issue.description || '')
  }, [issue.title, issue.description])

  const priorityIcons = {
    low: { icon: '↓', color: 'text-green-600', bg: 'bg-green-50' },
    medium: { icon: '→', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    high: { icon: '↑', color: 'text-orange-600', bg: 'bg-orange-50' },
    urgent: { icon: '⇈', color: 'text-red-600', bg: 'bg-red-50' },
  }

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== issue.title && onUpdate) {
      onUpdate(issue.id, { title: editTitle.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleDescriptionSave = () => {
    if (editDescription !== issue.description && onUpdate) {
      onUpdate(issue.id, { description: editDescription })
    }
    setIsEditingDescription(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setEditTitle(issue.title)
      setIsEditingTitle(false)
    }
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleDescriptionSave()
    } else if (e.key === 'Escape') {
      setEditDescription(issue.description || '')
      setIsEditingDescription(false)
    }
  }

  const formatRelativeTime = (dateString: Date) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        console.log('🚀 Starting drag for:', issue.title)
        onDragStart(issue)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', issue.id.toString())
      }}
      onDragEnd={onDragEnd}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none"
    >
      {/* Title */}
      {isEditingTitle ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyDown}
          className="font-medium text-gray-900 mb-3 w-full bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <Link to={`/projects/${projectId}/issues/${issue.id}`}>
          <h3 className="font-medium text-gray-900 mb-3 hover:text-blue-600 text-sm cursor-pointer">
            {issue.title}
          </h3>
        </Link>
      )}

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {issue.labels.map((label, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Metrics Row */}
      {!metrics.loading && (
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          {/* Subtask Progress */}
          {metrics.subtaskProgress && metrics.subtaskProgress.total > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 rounded-sm relative overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${metrics.subtaskProgress.percentage}%` }}
                />
              </div>
              <span>{metrics.subtaskProgress.completed}/{metrics.subtaskProgress.total}</span>
            </div>
          )}

          {/* Time Logged */}
          {metrics.timeSpent > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>{TimeTrackingService.formatTime(metrics.timeSpent)}</span>
            </div>
          )}

          {/* Comment Count */}
          {metrics.commentCount > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>{metrics.commentCount}</span>
            </div>
          )}

          {/* Last Updated */}
          <div className="flex items-center gap-1 ml-auto">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>{formatRelativeTime(issue.updatedAt)}</span>
          </div>
        </div>
      )}

      {/* Bottom row with priority, task ID, and assignee */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority indicator */}
          <div className={`w-4 h-4 flex items-center justify-center rounded ${priorityIcons[issue.priority].bg}`}>
            <span className={`text-xs font-bold ${priorityIcons[issue.priority].color}`}>
              {priorityIcons[issue.priority].icon}
            </span>
          </div>

          {/* Task ID */}
          <span className="text-xs font-medium text-gray-500">
            {issue.project?.key || 'TIS'}-{issue.id}
          </span>
        </div>

        {/* Assignee avatar */}
        {issue.assignee && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {issue.assignee.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const SimpleColumn = ({
  title,
  status,
  issues,
  draggedIssue,
  onDrop,
  onDropAtIndex,
  onDragOver,
  onDragStart,
  onDragEnd,
  onIssueUpdate,
  projectId
}: {
  title: string
  status: IssueStatus
  issues: Issue[]
  draggedIssue: Issue | null
  onDrop: (status: IssueStatus) => void
  onDropAtIndex: (status: IssueStatus, index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (issue: Issue) => void
  onDragEnd: () => void
  onIssueUpdate?: (issueId: number, updates: any) => void
  projectId: string
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  // Don't hide the dragged issue, just make it semi-transparent
  const displayIssues = issues

  const config = {
    todo: { color: 'bg-gray-50', icon: '📋' },
    in_progress: { color: 'bg-blue-50', icon: '🚧' },
    code_review: { color: 'bg-purple-50', icon: '👁️' },
    done: { color: 'bg-green-50', icon: '✅' },
  }[status]

  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-4 px-3">
        <h2 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">
          {title}
        </h2>
        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
          {issues.length}
        </span>
      </div>

      <div
        className={`min-h-[500px] p-6 rounded-lg border-2 border-dashed ${config.color} ${
          isDragOver ? 'border-blue-400 bg-blue-100' : 'border-gray-300'
        } transition-colors`}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          console.log('📦 Dropped in column:', status)
          onDrop(status)
          setDropIndex(null)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          setIsDragOver(true)
          onDragOver(e)
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          // Only hide if we're leaving the column entirely
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX
          const y = e.clientY

          if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setIsDragOver(false)
            setDropIndex(null)
          }
        }}
      >
        {/* Drop zone at the top */}
        <div
          className="h-4"
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('📦 Dropped at start of column:', status)
            onDropAtIndex(status, 0)
            setDropIndex(null)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDropIndex(0)
          }}
          onDragLeave={() => setDropIndex(null)}
        />

        {displayIssues.map((issue, index) => (
          <div key={issue.id} className="relative">
            <div className={draggedIssue?.id === issue.id ? 'opacity-50' : ''}>
              <SimpleIssueCard
                issue={issue}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onUpdate={onIssueUpdate}
                projectId={projectId}
              />
            </div>

            {/* Drop zone after each card */}
            <div
              className="h-4"
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('📦 Dropped after card at index:', index + 1)
                onDropAtIndex(status, index + 1)
                setDropIndex(null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDropIndex(index + 1)
              }}
              onDragLeave={() => setDropIndex(null)}
            />
          </div>
        ))}

        {/* Flex spacer for empty space */}
        <div className="flex-1 min-h-[50px]" />
      </div>
    </div>
  )
}

export const SimpleKanban = ({ issues, onIssueUpdate, project }: SimpleKanbanProps) => {
  const { projectId } = useParams<{ projectId: string }>()
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null)
  const [localIssues, setLocalIssues] = useState<Issue[]>(issues)
  const [isReordering, setIsReordering] = useState(false)

  // Update local state when props change, but not if we're actively reordering
  React.useEffect(() => {
    if (!isReordering && !draggedIssue) {
      setLocalIssues(issues)
    }
  }, [issues, isReordering, draggedIssue])

  const handleDragStart = (issue: Issue) => {
    console.log('🚀 Drag started:', issue.title)
    setDraggedIssue(issue)
    setIsReordering(true)
  }

  const handleDragEnd = () => {
    setDraggedIssue(null)
    setIsReordering(false)
  }

  const handleDrop = (newStatus: IssueStatus) => {
    console.log('📦 Drop:', draggedIssue?.title, 'to', newStatus)
    if (draggedIssue && draggedIssue.status !== newStatus && onIssueUpdate) {
      onIssueUpdate(draggedIssue.id, { status: newStatus })
    }
    handleDragEnd()
  }

  const handleDropAtIndex = (newStatus: IssueStatus, targetIndex: number) => {
    console.log('📦 Drop at index:', draggedIssue?.title, 'to', newStatus, 'at position', targetIndex)

    if (!draggedIssue) return

    const isSameStatus = draggedIssue.status === newStatus

    // Create a copy of the issue with updated status
    const updatedIssue = { ...draggedIssue, status: newStatus }

    // Get current issues by status
    const currentIssuesByStatus = {
      todo: localIssues.filter(issue => issue.status === 'todo'),
      in_progress: localIssues.filter(issue => issue.status === 'in_progress'),
      code_review: localIssues.filter(issue => issue.status === 'code_review'),
      done: localIssues.filter(issue => issue.status === 'done'),
    }

    // If reordering within same column, adjust target index
    let adjustedTargetIndex = targetIndex
    if (isSameStatus) {
      const currentIssues = currentIssuesByStatus[newStatus]
      const currentIndex = currentIssues.findIndex(issue => issue.id === draggedIssue.id)

      // If dragging down, we need to subtract 1 from target index
      if (currentIndex < targetIndex) {
        adjustedTargetIndex = targetIndex - 1
      }
    }

    // Remove the dragged issue from all status arrays
    const todoIssues = currentIssuesByStatus.todo.filter(issue => issue.id !== draggedIssue.id)
    const inProgressIssues = currentIssuesByStatus.in_progress.filter(issue => issue.id !== draggedIssue.id)
    const codeReviewIssues = currentIssuesByStatus.code_review.filter(issue => issue.id !== draggedIssue.id)
    const doneIssues = currentIssuesByStatus.done.filter(issue => issue.id !== draggedIssue.id)

    // Insert the issue at the correct position in the target column
    if (newStatus === 'todo') {
      todoIssues.splice(adjustedTargetIndex, 0, updatedIssue)
    } else if (newStatus === 'in_progress') {
      inProgressIssues.splice(adjustedTargetIndex, 0, updatedIssue)
    } else if (newStatus === 'code_review') {
      codeReviewIssues.splice(adjustedTargetIndex, 0, updatedIssue)
    } else if (newStatus === 'done') {
      doneIssues.splice(adjustedTargetIndex, 0, updatedIssue)
    }

    // Combine all issues back together
    const newIssues = [...todoIssues, ...inProgressIssues, ...codeReviewIssues, ...doneIssues]

    console.log('🔄 Before:', localIssues.map(i => `${i.title} (${i.status})`))
    console.log('🔄 After:', newIssues.map(i => `${i.title} (${i.status})`))
    console.log('🎯 Target index:', targetIndex, 'Adjusted:', adjustedTargetIndex, 'Same status:', isSameStatus)

    // Update local state immediately
    setLocalIssues(newIssues)

    // Update backend with position data
    if (onIssueUpdate) {
      // Calculate all new positions
      const positionUpdates = newIssues.map((issue, index) => ({
        id: issue.id,
        position: index,
        status: issue.status
      }))

      // Send reorder request
      fetch('/api/issues/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(positionUpdates)
      }).catch(console.error)

      // Also update the single issue status for immediate feedback
      onIssueUpdate(draggedIssue.id, { status: newStatus })
    }

    handleDragEnd()
  }

  const issuesByStatus = {
    todo: localIssues.filter(i => i.status === 'todo'),
    in_progress: localIssues.filter(i => i.status === 'in_progress'),
    code_review: localIssues.filter(i => i.status === 'code_review'),
    done: localIssues.filter(i => i.status === 'done'),
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
        <p className="text-gray-600">{project.description}</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <SimpleColumn
          title="To Do"
          status="todo"
          issues={issuesByStatus.todo}
          draggedIssue={draggedIssue}
          onDrop={handleDrop}
          onDropAtIndex={handleDropAtIndex}
          onDragOver={(e) => e.preventDefault()}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onIssueUpdate={onIssueUpdate}
          projectId={projectId || ''}
        />
        <SimpleColumn
          title="In Progress"
          status="in_progress"
          issues={issuesByStatus.in_progress}
          draggedIssue={draggedIssue}
          onDrop={handleDrop}
          onDropAtIndex={handleDropAtIndex}
          onDragOver={(e) => e.preventDefault()}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onIssueUpdate={onIssueUpdate}
          projectId={projectId || ''}
        />
        <SimpleColumn
          title="Code Review"
          status="code_review"
          issues={issuesByStatus.code_review}
          draggedIssue={draggedIssue}
          onDrop={handleDrop}
          onDropAtIndex={handleDropAtIndex}
          onDragOver={(e) => e.preventDefault()}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onIssueUpdate={onIssueUpdate}
          projectId={projectId || ''}
        />
        <SimpleColumn
          title="Done"
          status="done"
          issues={issuesByStatus.done}
          draggedIssue={draggedIssue}
          onDrop={handleDrop}
          onDropAtIndex={handleDropAtIndex}
          onDragOver={(e) => e.preventDefault()}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onIssueUpdate={onIssueUpdate}
          projectId={projectId || ''}
        />
      </div>
    </div>
  )
}