import { BaseApiService } from './base.service'
import type { Issue } from '../../types/domain.types'

export type SprintStatus = 'future' | 'active' | 'completed'

export interface Sprint {
  id: number
  name: string
  goal?: string
  status: SprintStatus
  projectId: number
  startDate?: Date
  endDate?: Date
  position: number
  issues: Issue[]
  createdById: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateSprintRequest {
  name: string
  goal?: string
  projectId: number
  createdById: number
}

export interface UpdateSprintRequest {
  name?: string
  goal?: string
  status?: SprintStatus
  startDate?: Date
  endDate?: Date
}

export interface StartSprintRequest {
  startDate: Date
  endDate: Date
}

export class SprintsService extends BaseApiService {
  static async create(data: CreateSprintRequest): Promise<Sprint> {
    return this.post<Sprint>('/sprints', data)
  }

  static async getByProject(projectId: number): Promise<Sprint[]> {
    return this.get<Sprint[]>(`/sprints?projectId=${projectId}`)
  }

  static async getById(id: number): Promise<Sprint> {
    return this.get<Sprint>(`/sprints/${id}`)
  }

  static async update(id: number, data: UpdateSprintRequest): Promise<Sprint> {
    return this.patch<Sprint>(`/sprints/${id}`, data)
  }

  static async delete(id: number): Promise<void> {
    return this.delete<void>(`/sprints/${id}`)
  }

  static async startSprint(id: number, data: StartSprintRequest): Promise<Sprint> {
    return this.post<Sprint>(`/sprints/${id}/start`, data)
  }

  static async completeSprint(id: number): Promise<Sprint> {
    return this.post<Sprint>(`/sprints/${id}/complete`, {})
  }

  static async addIssueToSprint(sprintId: number, issueId: number): Promise<void> {
    return this.post<void>(`/sprints/${sprintId}/add-issue/${issueId}`, {})
  }

  static async removeIssueFromSprint(issueId: number): Promise<void> {
    return this.post<void>(`/sprints/remove-issue/${issueId}`, {})
  }

  static async getBacklogIssues(projectId: number): Promise<Issue[]> {
    return this.get<Issue[]>(`/sprints/backlog?projectId=${projectId}`)
  }
}