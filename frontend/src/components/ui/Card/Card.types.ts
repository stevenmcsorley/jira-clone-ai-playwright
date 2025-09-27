import type { ReactNode, DragEvent, MouseEvent } from 'react'

export interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  draggable?: boolean
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  'data-testid'?: string
}