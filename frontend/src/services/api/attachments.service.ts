import { BaseApiService } from './base.service'

export interface Attachment {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  issueId: number
  uploadedById: number
  createdAt: string
  uploadedBy: {
    id: number
    name: string
    email: string
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export class AttachmentsService extends BaseApiService {
  static async uploadFile(issueId: number, file: File): Promise<Attachment> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/attachments/upload/${issueId}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  static async getByIssue(issueId: number): Promise<Attachment[]> {
    return this.get<Attachment[]>(`/attachments/issue/${issueId}`)
  }

  static async getById(id: number): Promise<Attachment> {
    return this.get<Attachment>(`/attachments/${id}`)
  }

  static async download(id: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/attachments/download/${id}`)
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }
    return response.blob()
  }

  static async deleteAttachment(id: number): Promise<void> {
    return this.delete<void>(`/attachments/${id}`)
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦'
    if (mimeType.includes('video')) return '🎬'
    if (mimeType.includes('audio')) return '🎵'
    return '📎'
  }

  static isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }
}