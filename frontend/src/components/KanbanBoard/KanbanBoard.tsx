import { XStateKanban } from '../XStateKanban'
import type { KanbanBoardProps } from './KanbanBoard.types'

export const KanbanBoard = ({
  project,
  issues,
  onIssueUpdate,
  loading = false,
  className,
  filters,
  onFiltersChange,
}: KanbanBoardProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} data-testid="kanban-board">
      <XStateKanban
        projectId={project.id}
        project={project}
        initialIssues={issues}
        onIssueUpdate={onIssueUpdate}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
    </div>
  )
}
