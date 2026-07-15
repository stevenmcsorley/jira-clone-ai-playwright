import { BaseApiService } from './base.service'
import type {
  WikiPage,
  WikiPageSummary,
  CreateWikiPageRequest,
} from '../../types/domain.types'

export class WikiService extends BaseApiService {
  static async list(projectId: number): Promise<WikiPageSummary[]> {
    return this.get<WikiPageSummary[]>(`/projects/${projectId}/wiki`)
  }

  static async getPage(projectId: number, pageId: number): Promise<WikiPage> {
    return this.get<WikiPage>(`/projects/${projectId}/wiki/${pageId}`)
  }

  static async create(
    projectId: number,
    data: CreateWikiPageRequest,
  ): Promise<WikiPage> {
    return this.post<WikiPage>(`/projects/${projectId}/wiki`, data)
  }

  static async update(
    projectId: number,
    pageId: number,
    data: Partial<CreateWikiPageRequest>,
  ): Promise<WikiPage> {
    return this.patch<WikiPage>(`/projects/${projectId}/wiki/${pageId}`, data)
  }

  static async remove(projectId: number, pageId: number): Promise<void> {
    return this.deleteRequest<void>(`/projects/${projectId}/wiki/${pageId}`)
  }
}
