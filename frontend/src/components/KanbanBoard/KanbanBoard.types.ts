import type { Issue, Project } from '../../types/domain.types'
import type { BoardFilters } from '../XStateKanban'

export interface KanbanBoardProps {
  project: Project
  issues: Issue[]
  onIssueUpdate?: (issueId: number, updates: Partial<Issue>) => void
  onIssueCreate?: (projectId: number) => void
  onIssueEdit?: (issue: Issue) => void
  onIssueDelete?: (issueId: number) => void
  loading?: boolean
  className?: string
  /** Active board filters — applied at render time inside the board. */
  filters?: BoardFilters
  /** When provided, the board renders a filter bar above its columns. */
  onFiltersChange?: (filters: BoardFilters) => void
  /** Active-sprint scoping: only this sprint's issues show; null = empty board. */
  activeSprintId?: number | null
}