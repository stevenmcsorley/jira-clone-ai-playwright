import { BaseApiService } from './base.service'
import type { IssueStatus } from '../../types/domain.types'

export interface Subtask {
  id: number
  title: string
  description?: string
  status: IssueStatus
  parentIssueId: number
  assigneeId?: number
  estimate?: number
  position: number
  createdAt: string
  updatedAt: string
  assignee?: {
    id: number
    name: string
    email: string
    avatar?: string
  }
}

export interface CreateSubtaskRequest {
  title: string
  description?: string
  parentIssueId: number
  assigneeId?: number
  estimate?: number
}

export interface UpdateSubtaskRequest {
  title?: string
  description?: string
  status?: IssueStatus
  assigneeId?: number
  estimate?: number
  position?: number
}

export interface SubtaskProgress {
  completed: number
  total: number
  percentage: number
}

export class SubtasksService extends BaseApiService {
  static async create(data: CreateSubtaskRequest): Promise<Subtask> {
    return this.post<Subtask>('/subtasks', data)
  }

  static async getByIssue(issueId: number): Promise<Subtask[]> {
    return this.get<Subtask[]>(`/subtasks/issue/${issueId}`)
  }

  static async getProgress(issueId: number): Promise<SubtaskProgress> {
    return this.get<SubtaskProgress>(`/subtasks/issue/${issueId}/progress`)
  }

  static async getById(id: number): Promise<Subtask> {
    return this.get<Subtask>(`/subtasks/${id}`)
  }

  static async update(id: number, data: UpdateSubtaskRequest): Promise<Subtask> {
    return this.patch<Subtask>(`/subtasks/${id}`, data)
  }

  static async reorder(issueId: number, subtaskIds: number[]): Promise<void> {
    return this.post<void>(`/subtasks/issue/${issueId}/reorder`, { subtaskIds })
  }

  static async deleteSubtask(id: number): Promise<void> {
    return this.delete<void>(`/subtasks/${id}`)
  }
}