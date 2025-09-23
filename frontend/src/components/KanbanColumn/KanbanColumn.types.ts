import type { Issue, IssueStatus } from '../../types/domain.types'

export interface KanbanColumnProps {
  title: string
  issues: Issue[]
  status: IssueStatus
  onIssueMove?: (issueId: number, newStatus: IssueStatus) => void
  onIssueCreate?: (status: IssueStatus) => void
  className?: string
}