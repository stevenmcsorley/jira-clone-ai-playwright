import { SimpleKanban } from '../SimpleKanban'
import type { KanbanBoardProps } from './KanbanBoard.types'
import type { IssueStatus } from '../../types/domain.types'

const columns: Array<{ status: IssueStatus; title: string }> = [
  { status: 'todo', title: 'TO DO' },
  { status: 'in_progress', title: 'IN PROGRESS' },
  { status: 'code_review', title: 'CODE REVIEW' },
  { status: 'done', title: 'DONE' },
]

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