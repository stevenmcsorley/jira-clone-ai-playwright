import type { ReactNode } from 'react'
import type { Issue, Project, User } from './domain.types'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface InputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  className?: string
  type?: 'text' | 'email' | 'password'
}

export interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export interface IssueCardProps {
  issue: Issue
  onEdit?: (issue: Issue) => void
  onDelete?: (issueId: number) => void
  draggable?: boolean
  className?: string
}

export interface KanbanColumnProps {
  title: string
  issues: Issue[]
  status: Issue['status']
  onIssueMove?: (issueId: number, newStatus: Issue['status']) => void
  onIssueCreate?: (status: Issue['status']) => void
  className?: string
}

export interface ProjectListProps {
  projects: Project[]
  onProjectSelect?: (project: Project) => void
  selectedProject?: Project | null
  loading?: boolean
}

export interface UserSelectProps {
  users: User[]
  selectedUserId?: number
  onSelect: (userId: number) => void
  placeholder?: string
  className?: string
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}