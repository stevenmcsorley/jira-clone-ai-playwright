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
  epicId?: number
  epic?: Issue
  epicIssues?: Issue[]
  // Enhanced fields
  dueDate?: string // ISO date string
  componentIds?: number[] // Array of component IDs
  components?: Component[] // Populated component objects
  fixVersionId?: number // Fix version ID
  fixVersion?: Version // Populated version object
  affectsVersionId?: number // Affects version ID
  affectsVersion?: Version // Populated version object
  originalEstimate?: number // Original time estimate in hours
  remainingEstimate?: number // Remaining time estimate in hours
  timeSpent?: number // Actual time spent in hours
  createdAt: Date
  updatedAt: Date
}

// Component interface for project categorization
export interface Component {
  id: number
  name: string
  description?: string
  projectId: number
  leadId?: number
  leadName?: string
  issueCount?: number
  createdAt: Date
  updatedAt: Date
}

// Version interface for release management
export interface Version {
  id: number
  name: string
  description?: string
  projectId: number
  releaseDate?: string // ISO date string
  status: 'unreleased' | 'released' | 'archived'
  issueCount?: number
  completedIssues?: number
  createdAt: Date
  updatedAt: Date
}

// Notification interfaces for watchers system
export interface Notification {
  id: number
  type: 'issue_updated' | 'issue_assigned' | 'issue_commented' | 'issue_status_changed'
  title: string
  message: string
  issueId: number
  issue?: Issue
  userId: number
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IssueWatcher {
  id: number
  issueId: number
  userId: number
  user?: User
  autoWatched: boolean // true if auto-watched (assigned, commented, created)
  createdAt: Date
}

export interface NotificationPreferences {
  id: number
  userId: number
  emailNotifications: boolean
  inAppNotifications: boolean
  autoWatchOnAssign: boolean
  autoWatchOnComment: boolean
  autoWatchOnCreate: boolean
  digestFrequency: 'none' | 'daily' | 'weekly'
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
  epicId?: number
}

export interface UpdateIssueRequest {
  title?: string
  description?: string
  status?: IssueStatus
  priority?: IssuePriority
  assigneeId?: number
  estimate?: number
  labels?: string[]
  epicId?: number
}