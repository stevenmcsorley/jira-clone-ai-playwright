import { BaseApiService } from './base.service'
import type { Issue, CreateIssueRequest, UpdateIssueRequest } from '../../types/domain.types'

export class IssuesService extends BaseApiService {
  static async getAll(): Promise<Issue[]> {
    return this.get<Issue[]>('/issues')
  }

  static async getByProject(projectId: number): Promise<Issue[]> {
    return this.get<Issue[]>(`/issues?projectId=${projectId}`)
  }

  static async getForBoard(projectId: number): Promise<Issue[]> {
    return this.get<Issue[]>(`/issues?projectId=${projectId}&boardView=true`)
  }

  static async getById(id: number): Promise<Issue> {
    return this.get<Issue>(`/issues/${id}`)
  }

  static async create(data: CreateIssueRequest): Promise<Issue> {
    return this.post<Issue>('/issues', data)
  }

  static async update(id: number, data: UpdateIssueRequest): Promise<Issue> {
    return this.patch<Issue>(`/issues/${id}`, data)
  }

  static async delete(id: number): Promise<void> {
    return this.delete<void>(`/issues/${id}`)
  }
}