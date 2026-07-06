import { useState, useEffect, useRef, useCallback } from 'react'
import { AttachmentsService, type Attachment } from '../../services/api/attachments.service'
import { Button } from '../ui/Button'
import { CollapsibleCard } from '../CollapsibleCard'

interface AttachmentsProps {
  issueId: number
}

export const Attachments = ({ issueId }: AttachmentsProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadsEnabled, setUploadsEnabled] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/config')
      .then(res => (res.ok ? res.json() : { uploadsEnabled: false }))
      .then(config => setUploadsEnabled(Boolean(config?.uploadsEnabled)))
      .catch(() => setUploadsEnabled(false))
  }, [])

  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await AttachmentsService.getByIssue(issueId)
      setAttachments(data)
    } catch (error) {
      console.error('Error fetching attachments:', error)
    } finally {
      setLoading(false)
    }
  }, [issueId])

  useEffect(() => {
    fetchAttachments()
  }, [fetchAttachments])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    try {
      setUploading(true)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        await AttachmentsService.uploadFile(issueId, file)
      }

      await fetchAttachments()
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    try {
      await AttachmentsService.deleteAttachment(attachmentId)
      await fetchAttachments()
    } catch (error) {
      console.error('Error deleting attachment:', error)
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const blob = await AttachmentsService.download(attachment.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading attachment:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    handleFileUpload(files)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <CollapsibleCard
      title="Attachments"
      count={attachments.length}
      defaultOpen={attachments.length > 0}
      testId="attachments-section"
    >
      {/* Upload Area — hidden when uploads are disabled for this instance */}
      {uploadsEnabled ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          <div className="text-gray-500">
            <div className="text-2xl mb-2">📎</div>
            <p className="mb-2">
              Drag and drop files here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:underline"
                disabled={uploading}
              >
                browse to upload
              </button>
            </p>
            <p className="text-sm text-gray-400">
              Maximum file size: 10MB
            </p>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Uploading...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6 text-center text-sm text-gray-500">
          File uploads are turned off for this instance.
        </div>
      )}

      {/* Attachments List */}
      <div className="space-y-3">
        {attachments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No attachments yet</p>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {AttachmentsService.getFileIcon(attachment.mimeType)}
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    {attachment.originalName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{AttachmentsService.formatFileSize(attachment.size)}</span>
                    <span>•</span>
                    <span>by {attachment.uploadedBy.name}</span>
                    <span>•</span>
                    <span>{formatDate(attachment.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleDownload(attachment)}
                  variant="secondary"
                  size="sm"
                >
                  Download
                </Button>
                <Button
                  onClick={() => handleDeleteAttachment(attachment.id)}
                  variant="secondary"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </CollapsibleCard>
  )
}