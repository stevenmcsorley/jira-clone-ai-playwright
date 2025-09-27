import { SimpleKanban } from '../SimpleKanban'
import { XStateKanban } from '../XStateKanban'
import type { KanbanBoardProps } from './KanbanBoard.types'
import type { IssueStatus } from '../../types/domain.types'

const _columns: Array<{ status: IssueStatus; title: string }> = [
  { status: 'todo', title: 'TO DO' },
  { status: 'in_progress', title: 'IN PROGRESS' },
  { status: 'code_review', title: 'CODE REVIEW' },
  { status: 'done', title: 'DONE' },
]

// Feature flag for XState integration
const USE_XSTATE_KANBAN = true; // Set to false to use legacy SimpleKanban

export const KanbanBoard = ({
  project,
  issues,
  onIssueUpdate,
  loading = false,
  className,
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

  // Use XState Kanban if feature flag is enabled
  if (USE_XSTATE_KANBAN) {
    return (
      <div className={className} data-testid="kanban-board">
        <XStateKanban
          projectId={project.id}
          project={project}
          initialIssues={issues}
          onIssueUpdate={onIssueUpdate}
        />
      </div>
    )
  }

  // Fallback to legacy SimpleKanban
  return (
    <div className={className} data-testid="kanban-board">
      <SimpleKanban
        project={project}
        issues={issues}
        onIssueUpdate={onIssueUpdate}
      />
    </div>
  )
}