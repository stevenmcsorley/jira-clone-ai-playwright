import { Card } from '../ui/Card'
import type { Issue } from '../../types/domain.types'

interface SimpleIssueCardProps {
  issue: Issue
  onEdit?: (issue: Issue) => void
  onDelete?: (issueId: number) => void
  onDragStart?: (e: React.DragEvent, issue: Issue) => void
  className?: string
}

const priorityColors = {
  low: 'border-green-400',
  medium: 'border-yellow-400',
  high: 'border-orange-400',
  urgent: 'border-red-400',
}

const typeIcons = {
  story: '📖',
  task: '✅',
  bug: '🐛',
  epic: '🎯',
}

export const SimpleIssueCard = ({
  issue,
  onEdit,
  onDelete: _onDelete,
  onDragStart,
  className,
}: SimpleIssueCardProps) => {
  const handleClick = () => {
    if (onEdit) {
      onEdit(issue)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', issue.id.toString())
    if (onDragStart) {
      onDragStart(e, issue)
    }
  }

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow duration-200 ${className}`}
      padding={false}
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      data-testid={`issue-card-${issue.id}`}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">{typeIcons[issue.type]}</span>
            <span className="text-xs text-gray-500 font-medium">
              {issue.project?.key}-{issue.id}
            </span>
          </div>
          <div className={`w-2 h-2 rounded-full ${priorityColors[issue.priority].replace('border-', 'bg-')}`} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          {issue.title}
        </h3>

        {/* Bottom row with assignee and story points */}
        <div className="flex items-center justify-between">
          {/* Assignee */}
          {issue.assignee && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {issue.assignee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-600">
                {issue.assignee.name.split(' ')[0]}
              </span>
            </div>
          )}

          {/* Story Points */}
          {(issue.storyPoints !== null && issue.storyPoints !== undefined && issue.storyPoints !== '' && issue.storyPoints !== 0) ? (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
              📊 {issue.storyPoints}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-50 text-gray-500 rounded-full border border-dashed border-gray-300">
              📊 ?
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}