import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '../ui/Card'
import type { DraggableIssueCardProps } from './DraggableIssueCard.types'

const priorityColors = {
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  urgent: 'text-red-600 bg-red-50 border-red-200',
}

const typeIcons = {
  story: '📖',
  task: '✅',
  bug: '🐛',
  epic: '🎯',
}

export const DraggableIssueCard = ({
  issue,
  onEdit,
  onDelete,
  className,
}: DraggableIssueCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleClick = () => {
    if (onEdit) {
      onEdit(issue)
    }
  }

  const cardClasses = [
    'cursor-grab active:cursor-grabbing',
    'hover:shadow-md transition-shadow duration-200',
    isDragging ? 'opacity-50' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={cardClasses} padding={false}>
        <div
          className="p-4 relative overflow-hidden"
          onClick={handleClick}
          data-testid={`issue-card-${issue.id}`}
        >
          {/* Priority indicator line */}
          <div className={`absolute top-0 left-0 w-full h-1 ${priorityColors[issue.priority].split(' ')[2]}`} />

          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{typeIcons[issue.type]}</span>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {issue.project?.key}-{issue.id}
              </span>
            </div>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full border ${priorityColors[issue.priority]}`}
            >
              {issue.priority}
            </span>
          </div>

          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 text-base leading-tight">
            {issue.title}
          </h3>

          {issue.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
              {issue.description}
            </p>
          )}

          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {issue.labels.slice(0, 3).map((label) => (
                <span
                  key={label}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium"
                >
                  {label}
                </span>
              ))}
              {issue.labels.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">
                  +{issue.labels.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {issue.assignee && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-xs font-bold text-white">
                      {issue.assignee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {issue.assignee.name.split(' ')[0]}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {issue.estimate && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">
                  {issue.estimate}sp
                </span>
              )}
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation()
                  if (onDelete) onDelete(issue.id)
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}