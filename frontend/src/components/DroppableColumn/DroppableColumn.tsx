import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '../ui/Button'
import { DraggableIssueCard } from '../DraggableIssueCard'
import type { DroppableColumnProps } from './DroppableColumn.types'

const statusConfig = {
  todo: {
    color: 'border-gray-300 bg-gray-50',
    headerColor: 'text-gray-700',
    accentColor: 'bg-gray-400',
    icon: '📋',
  },
  in_progress: {
    color: 'border-blue-300 bg-blue-50',
    headerColor: 'text-blue-700',
    accentColor: 'bg-blue-400',
    icon: '🚧',
  },
  done: {
    color: 'border-green-300 bg-green-50',
    headerColor: 'text-green-700',
    accentColor: 'bg-green-400',
    icon: '✅',
  },
}

export const DroppableColumn = ({
  title,
  issues,
  status,
  onIssueMove,
  onIssueCreate,
  onIssueEdit,
  onIssueDelete,
  className,
}: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const config = statusConfig[status]
  const issueIds = issues.map(issue => issue.id.toString())

  const handleCreateIssue = () => {
    if (onIssueCreate) {
      onIssueCreate(status)
    }
  }

  const columnClasses = [
    'flex flex-col h-full min-h-[600px]',
    isOver ? 'shadow-lg' : 'shadow-md',
    className,
  ].filter(Boolean).join(' ')

  const dropZoneClasses = [
    'rounded-lg border-2 p-4 h-full transition-colors duration-200',
    config.color,
    isOver ? 'border-blue-500 bg-blue-100' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={columnClasses} data-testid={`kanban-column-${status}`}>
      <div ref={setNodeRef} className={dropZoneClasses}>
        {/* Column Header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-xl">{config.icon}</span>
            <h2 className={`font-bold text-lg ${config.headerColor}`}>
              {title}
            </h2>
            <div className={`w-6 h-6 rounded-full ${config.accentColor} flex items-center justify-center`}>
              <span className="text-white text-sm font-bold">
                {issues.length}
              </span>
            </div>
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
          <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {issues.map((issue) => (
                <DraggableIssueCard
                  key={issue.id}
                  issue={issue}
                  onEdit={onIssueEdit}
                  onDelete={onIssueDelete}
                  className="group"
                />
              ))}
            </div>
          </SortableContext>

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
        {isOver && (
          <div className="absolute inset-0 bg-blue-200 bg-opacity-20 rounded-xl border-2 border-blue-400 border-dashed pointer-events-none flex items-center justify-center">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
              Drop issue here
            </div>
          </div>
        )}
      </div>
    </div>
  )
}