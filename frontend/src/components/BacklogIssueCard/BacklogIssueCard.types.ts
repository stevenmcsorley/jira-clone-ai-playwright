import type { DragEventHandler, ReactNode } from 'react'
import type { Issue } from '../../types/domain.types'

export interface BacklogIssueCardProps {
  issue: Issue
  projectKey: string
  projectId?: string
  showUpdated?: boolean
  onDragStart?: DragEventHandler<HTMLElement>
  actions?: ReactNode
  className?: string
}
