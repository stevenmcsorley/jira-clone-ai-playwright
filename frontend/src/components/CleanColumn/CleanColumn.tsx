import { useState } from 'react'
import { Button } from '../ui/Button'
import { CleanIssueCard } from '../CleanIssueCard'
import type { Issue, IssueStatus } from '../../types/domain.types'

interface CleanColumnProps {
  title: string
  issues: Issue[]
  status: IssueStatus
  onIssueMove?: (issueId: number, newStatus: IssueStatus) => void
  onIssueCreate?: (status: IssueStatus) => void
  onIssueEdit?: (issue: Issue) => void
  onIssueDelete?: (issueId: number) => void
  className?: string
}

const statusConfig = {
  todo: {
    color: 'bg-gray-50',
    headerColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: '📋',
  },
  in_progress: {
    color: 'bg-blue-50',
    headerColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: '🚧',
  },
  done: {
    color: 'bg-green-50',
    headerColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: '✅',
  },
}

export const CleanColumn = ({
  title,
  issues,
  status,
  onIssueMove,
  onIssueCreate,
  onIssueEdit,
  onIssueDelete,
  className,
}: CleanColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const config = statusConfig[status]

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    console.log('Drop event in column:', status)

    try {
      let issueId: number

      // Try to get data from JSON first
      const jsonData = e.dataTransfer.getData('application/json')
      if (jsonData) {
        const data = JSON.parse(jsonData)
        issueId = data.id
      } else {
        // Fallback to plain text
        const textData = e.dataTransfer.getData('text/plain')
        issueId = parseInt(textData)
      }

      console.log('Moving issue', issueId, 'to status', status)

      if (issueId && onIssueMove) {
        onIssueMove(issueId, status)
      }
    } catch (error) {
      console.error('Failed to parse drop data:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleCreateIssue = () => {
    if (onIssueCreate) {
      onIssueCreate(status)
    }
  }

  return (
    <div
      className={`flex flex-col h-full min-h-[500px] ${className}`}
      data-testid={`kanban-column-${status}`}
    >
      <div
        className={`
          rounded-lg border-2 p-4 h-full transition-all duration-200
          ${config.color} ${config.borderColor}
          ${isDragOver ? 'border-blue-400 bg-blue-100 border-solid' : 'border-dashed'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-xl">{config.icon}</span>
            <h2 className={`font-bold text-lg ${config.headerColor}`}>
              {title}
            </h2>
            <span className="bg-gray-200 text-gray-700 text-sm font-bold px-2 py-1 rounded-full">
              {issues.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateIssue}
            className="hover:bg-white hover:shadow-md transition-all duration-200"
            data-testid={`add-issue-${status}`}
          >
            + Add
          </Button>
        </div>

        {/* Issues Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {issues.map((issue) => (
              <CleanIssueCard
                key={issue.id}
                issue={issue}
                onEdit={onIssueEdit}
                onDelete={onIssueDelete}
              />
            ))}
          </div>

          {/* Empty State */}
          {issues.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4 opacity-20">
                {config.icon}
              </div>
              <p className="text-gray-500 mb-4 font-medium">
                No issues in {title.toLowerCase()}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateIssue}
                className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
              >
                Create first issue
              </Button>
            </div>
          )}
        </div>

        {/* Drop Indicator */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-200 bg-opacity-20 rounded-lg border-2 border-blue-400 border-dashed pointer-events-none flex items-center justify-center">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
              Drop issue here
            </div>
          </div>
        )}
      </div>
    </div>
  )
}