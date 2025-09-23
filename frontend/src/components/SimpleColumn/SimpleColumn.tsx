import { Button } from '../ui/Button'
import { SimpleIssueCard } from '../SimpleIssueCard'
import type { Issue, IssueStatus } from '../../types/domain.types'

interface SimpleColumnProps {
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
    color: 'bg-gray-50 border-gray-200',
    headerColor: 'text-gray-700',
    icon: '📋',
  },
  in_progress: {
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'text-blue-700',
    icon: '🚧',
  },
  done: {
    color: 'bg-green-50 border-green-200',
    headerColor: 'text-green-700',
    icon: '✅',
  },
}

export const SimpleColumn = ({
  title,
  issues,
  status,
  onIssueMove,
  onIssueCreate,
  onIssueEdit,
  onIssueDelete,
  className,
}: SimpleColumnProps) => {
  const config = statusConfig[status]

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const issueId = parseInt(e.dataTransfer.getData('text/plain'))
    if (onIssueMove && issueId) {
      onIssueMove(issueId, status)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleCreateIssue = () => {
    if (onIssueCreate) {
      onIssueCreate(status)
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`} data-testid={`kanban-column-${status}`}>
      <div
        className={`rounded-lg border-2 border-dashed p-4 h-full ${config.color} transition-colors`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <h2 className={`font-semibold ${config.headerColor}`}>
              {title}
            </h2>
            <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
              {issues.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateIssue}
            className="text-gray-500 hover:text-gray-700"
            data-testid={`add-issue-${status}`}
          >
            +
          </Button>
        </div>

        {/* Issues */}
        <div className="space-y-2 overflow-y-auto">
          {issues.map((issue) => (
            <SimpleIssueCard
              key={issue.id}
              issue={issue}
              onEdit={onIssueEdit}
              onDelete={onIssueDelete}
            />
          ))}
        </div>

        {/* Empty State */}
        {issues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-2 opacity-30">
              {config.icon}
            </div>
            <p className="text-gray-400 text-sm mb-3">
              No issues
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateIssue}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              Add first issue
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}