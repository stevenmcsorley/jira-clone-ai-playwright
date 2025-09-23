import type { Issue } from '../../types/domain.types'

export interface IssueCardProps {
  issue: Issue
  onEdit?: (issue: Issue) => void
  onDelete?: (issueId: number) => void
  draggable?: boolean
  className?: string
}