import { BaseApiService } from './base.service'
import type { Issue } from '../../types/domain.types'

export type IssueLinkType =
  | 'blocks' | 'blocked_by'
  | 'duplicates' | 'duplicated_by'
  | 'relates_to'
  | 'causes' | 'caused_by'
  | 'clones' | 'cloned_by'
  | 'child_of' | 'parent_of'

export interface IssueLink {
  id: number
  sourceIssueId: number
  targetIssueId: number
  linkType: IssueLinkType
  sourceIssue?: Issue
  targetIssue?: Issue
  createdAt: Date
  createdBy: {
    id: number
    name: string
  }
}

export interface CreateIssueLinkRequest {
  sourceIssueId: number
  targetIssueId: number
  linkType: IssueLinkType
  createdById: number
}

export class IssueLinksService extends BaseApiService {
  static async create(data: CreateIssueLinkRequest): Promise<IssueLink> {
    return this.post<IssueLink>('/issue-links', data)
  }

  static async getByIssueId(issueId: number): Promise<IssueLink[]> {
    return this.get<IssueLink[]>(`/issue-links/issue/${issueId}`)
  }

  static async delete(id: number): Promise<void> {
    return this.delete<void>(`/issue-links/${id}`)
  }

  static async searchIssues(query: string, projectId?: number): Promise<Issue[]> {
    const params = new URLSearchParams({ query })
    if (projectId) {
      params.append('projectId', projectId.toString())
    }
    return this.get<Issue[]>(`/issue-links/search?${params.toString()}`)
  }
}