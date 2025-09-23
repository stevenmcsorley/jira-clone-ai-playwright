import type { Issue, IssueStatus } from '../../types/domain.types'

export interface DroppableColumnProps {
  title: string
  issues: Issue[]
  status: IssueStatus
  onIssueMove?: (issueId: number, newStatus: IssueStatus) => void
  onIssueCreate?: (status: IssueStatus) => void
  onIssueEdit?: (issue: Issue) => void
  onIssueDelete?: (issueId: number) => void
  className?: string
}