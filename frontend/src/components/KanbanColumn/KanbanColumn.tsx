import { Button } from '../ui/Button'
import { IssueCard } from '../IssueCard'
import type { KanbanColumnProps } from './KanbanColumn.types'

const statusColors = {
  todo: 'border-gray-300 bg-gray-50',
  in_progress: 'border-blue-300 bg-blue-50',
  done: 'border-green-300 bg-green-50',
}

export const KanbanColumn = ({
  title,
  issues,
  status,
  onIssueMove,
  onIssueCreate,
  className,
}: KanbanColumnProps) => {
  const handleCreateIssue = () => {
    if (onIssueCreate) {
      onIssueCreate(status)
    }
  }

  const classes = [
    'flex flex-col h-full',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} data-testid={`kanban-column-${status}`}>
      <div className={`rounded-lg border-2 border-dashed p-4 h-full ${statusColors[status]}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">{title}</h2>
            <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full">
              {issues.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateIssue}
            data-testid={`add-issue-${status}`}
          >
            +
          </Button>
        </div>

        <div className="space-y-3 flex-1">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              draggable
              onEdit={(issue) => console.log('Edit issue:', issue)}
            />
          ))}

          {issues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No issues</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateIssue}
                className="mt-2"
              >
                Create first issue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}