import { Card } from '../ui/Card'
import type { Issue } from '../../types/domain.types'

interface CleanIssueCardProps {
  issue: Issue
  onEdit?: (issue: Issue) => void
  onDelete?: (issueId: number) => void
  isDragging?: boolean
  className?: string
}

const priorityColors = {
  low: 'border-l-green-400',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-400',
}

const typeIcons = {
  story: '📖',
  task: '✅',
  bug: '🐛',
  epic: '🎯',
}

export const CleanIssueCard = ({
  issue,
  onEdit,
  onDelete,
  isDragging = false,
  className,
}: CleanIssueCardProps) => {
  const handleClick = () => {
    if (onEdit) {
      onEdit(issue)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    console.log('Drag started for issue:', issue.id)
    e.dataTransfer.setData('application/json', JSON.stringify({ id: issue.id, type: 'issue' }))
    e.dataTransfer.setData('text/plain', issue.id.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <Card
      className={`
        cursor-pointer hover:shadow-md transition-shadow duration-200
        border-l-4 ${priorityColors[issue.priority]}
        ${isDragging ? 'opacity-50' : ''}
        ${className}
      `}
      padding={false}
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      data-testid={`issue-card-${issue.id}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeIcons[issue.type]}</span>
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {issue.project?.key}-{issue.id}
            </span>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">
            {issue.priority}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">
          {issue.title}
        </h3>

        {issue.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {issue.description}
          </p>
        )}

        {issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {issue.labels.slice(0, 2).map((label) => (
              <span
                key={label}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium"
              >
                {label}
              </span>
            ))}
            {issue.labels.length > 2 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded font-medium">
                +{issue.labels.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {issue.assignee && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {issue.assignee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700">
                {issue.assignee.name.split(' ')[0]}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {issue.estimate && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {issue.estimate}sp
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}