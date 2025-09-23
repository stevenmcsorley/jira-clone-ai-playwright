import { BaseApiService } from './base.service'
import type { Project, CreateProjectRequest } from '../../types/domain.types'

export class ProjectsService extends BaseApiService {
  static async getAll(): Promise<Project[]> {
    return this.get<Project[]>('/projects')
  }

  static async getById(id: number): Promise<Project> {
    return this.get<Project>(`/projects/${id}`)
  }

  static async create(data: CreateProjectRequest): Promise<Project> {
    return this.post<Project>('/projects', data)
  }

  static async update(id: number, data: Partial<CreateProjectRequest>): Promise<Project> {
    return this.patch<Project>(`/projects/${id}`, data)
  }

  static async delete(id: number): Promise<void> {
    return this.delete<void>(`/projects/${id}`)
  }
}