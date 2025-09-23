import type { Issue, Project } from '../../types/domain.types'

export interface KanbanBoardProps {
  project: Project
  issues: Issue[]
  onIssueUpdate?: (issueId: number, updates: Partial<Issue>) => void
  onIssueCreate?: (projectId: number) => void
  onIssueEdit?: (issue: Issue) => void
  onIssueDelete?: (issueId: number) => void
  loading?: boolean
  className?: string
}