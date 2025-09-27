import { useState, useEffect, useCallback } from 'react'
import { CommentsService, type Comment, type CreateCommentRequest } from '../../services/api/comments.service'
import { Button } from '../ui/Button'

interface CommentsProps {
  issueId: number
}

export const Comments = ({ issueId }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await CommentsService.getByIssue(issueId)
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }, [issueId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    try {
      setSubmitting(true)
      const commentData: CreateCommentRequest = {
        content: newComment,
        issueId,
      }
      await CommentsService.create(commentData)
      setNewComment('')
      await fetchComments()
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim() || submitting) return

    try {
      setSubmitting(true)
      const replyData: CreateCommentRequest = {
        content: replyContent,
        issueId,
        parentId,
      }
      await CommentsService.create(replyData)
      setReplyContent('')
      setReplyingTo(null)
      await fetchComments()
    } catch (error) {
      console.error('Error creating reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim() || submitting) return

    try {
      setSubmitting(true)
      await CommentsService.update(commentId, { content: editContent })
      setEditContent('')
      setEditingComment(null)
      await fetchComments()
    } catch (error) {
      console.error('Error updating comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      await CommentsService.deleteComment(commentId)
      await fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {comment.author.name.charAt(0)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900">{comment.author.name}</span>
              <span className="text-sm text-gray-500 ml-2">
                {formatDate(comment.createdAt)}
                {comment.isEdited && ' (edited)'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reply
            </button>
            <button
              onClick={() => {
                setEditingComment(comment.id)
                setEditContent(comment.content)
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>

        {editingComment === comment.id ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Edit your comment..."
            />
            <div className="flex items-center gap-2 mt-2">
              <Button
                onClick={() => handleEditComment(comment.id)}
                disabled={submitting}
                size="sm"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setEditingComment(null)
                  setEditContent('')
                }}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-gray-700 whitespace-pre-wrap">{comment.content}</div>
        )}

        {replyingTo === comment.id && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Write a reply..."
            />
            <div className="flex items-center gap-2 mt-2">
              <Button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={submitting || !replyContent.trim()}
                size="sm"
              >
                Reply
              </Button>
              <Button
                onClick={() => {
                  setReplyingTo(null)
                  setReplyContent('')
                }}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {comment.replies && comment.replies.map((reply) => renderComment(reply, true))}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Activity ({comments.length} comments)
      </h3>

      {/* New Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          placeholder="Add a comment..."
        />
        <div className="flex items-center justify-end mt-2">
          <Button
            type="submit"
            disabled={submitting || !newComment.trim()}
            size="sm"
          >
            Comment
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-0">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No comments yet</p>
        ) : (
          comments
            .filter((comment) => !comment.parentId)
            .map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  )
}