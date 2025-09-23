import { BaseApiService } from './base.service'

export interface Comment {
  id: number
  content: string
  issueId: number
  authorId: number
  parentId?: number
  isEdited: boolean
  editedAt?: string
  createdAt: string
  updatedAt: string
  author: {
    id: number
    name: string
    email: string
    avatar?: string
  }
  replies?: Comment[]
}

export interface CreateCommentRequest {
  content: string
  issueId: number
  parentId?: number
}

export interface UpdateCommentRequest {
  content?: string
}

export class CommentsService extends BaseApiService {
  static async create(data: CreateCommentRequest): Promise<Comment> {
    return this.post<Comment>('/comments', data)
  }

  static async getByIssue(issueId: number): Promise<Comment[]> {
    return this.get<Comment[]>(`/comments/issue/${issueId}`)
  }

  static async getById(id: number): Promise<Comment> {
    return this.get<Comment>(`/comments/${id}`)
  }

  static async update(id: number, data: UpdateCommentRequest): Promise<Comment> {
    return this.patch<Comment>(`/comments/${id}`, data)
  }

  static async deleteComment(id: number): Promise<void> {
    return this.delete<void>(`/comments/${id}`)
  }
}