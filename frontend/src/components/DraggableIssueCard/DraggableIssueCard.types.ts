import type { Issue } from '../../types/domain.types'

export interface DraggableIssueCardProps {
  issue: Issue
  onEdit?: (issue: Issue) => void
  onDelete?: (issueId: number) => void
  isDragging?: boolean
  className?: string
}