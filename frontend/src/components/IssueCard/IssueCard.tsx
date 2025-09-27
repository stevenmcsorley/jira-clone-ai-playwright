import { Card } from '../ui/Card'
import type { IssueCardProps } from './IssueCard.types'

const priorityColors = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  high: 'text-orange-600 bg-orange-50',
  urgent: 'text-red-600 bg-red-50',
}

const typeIcons = {
  story: '📖',
  task: '✅',
  bug: '🐛',
  epic: '🎯',
}

export const IssueCard = ({
  issue,
  onEdit,
  onDelete: _onDelete,
  draggable = false,
  className,
}: IssueCardProps) => {
  const handleClick = () => {
    if (onEdit) {
      onEdit(issue)
    }
  }

  const classes = [
    'cursor-pointer hover:shadow-medium transition-shadow',
    draggable ? 'hover:scale-[1.02]' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <Card className={classes} padding={false}>
      <div
        className="p-4"
        onClick={handleClick}
        data-testid={`issue-card-${issue.id}`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeIcons[issue.type]}</span>
            <span className="text-sm font-medium text-gray-600">
              {issue.project?.key}-{issue.id}
            </span>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[issue.priority]}`}
          >
            {issue.priority}
          </span>
        </div>

        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {issue.title}
        </h3>

        {issue.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {issue.description}
          </p>
        )}

        {issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {issue.labels.map((label) => (
              <span
                key={label}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {issue.assignee && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-700">
                    {issue.assignee.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {issue.assignee.name}
                </span>
              </div>
            )}
          </div>

          {issue.estimate && (
            <span className="text-sm text-gray-500">
              {issue.estimate}sp
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}