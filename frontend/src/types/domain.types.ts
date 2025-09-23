export interface User {
  id: number
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: number
  name: string
  key: string
  description?: string
  leadId: number
  lead?: User
  createdAt: Date
  updatedAt: Date
}

export type IssueStatus = 'todo' | 'in_progress' | 'code_review' | 'done'
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'
export type IssueType = 'story' | 'task' | 'bug' | 'epic'

export interface Issue {
  id: number
  title: string
  description?: string
  status: IssueStatus
  priority: IssuePriority
  type: IssueType
  projectId: number
  project?: Project
  assigneeId?: number
  assignee?: User
  reporterId: number
  reporter?: User
  estimate?: number
  labels: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: number
  content: string
  issueId: number
  authorId: number
  author?: User
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectRequest {
  name: string
  key: string
  description?: string
  leadId: number
}

export interface CreateIssueRequest {
  title: string
  description?: string
  type: IssueType
  priority: IssuePriority
  projectId: number
  assigneeId?: number
  estimate?: number
  labels?: string[]
}

export interface UpdateIssueRequest {
  title?: string
  description?: string
  status?: IssueStatus
  priority?: IssuePriority
  assigneeId?: number
  estimate?: number
  labels?: string[]
}