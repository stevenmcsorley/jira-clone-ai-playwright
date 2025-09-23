import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
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

interface IssueLinksProps {
  issue: Issue
  projectId: string
  onLinkCreate?: (targetIssueId: number, linkType: IssueLinkType) => Promise<void>
  onLinkDelete?: (linkId: number) => Promise<void>
}

export const IssueLinks = ({ issue, projectId, onLinkCreate, onLinkDelete }: IssueLinksProps) => {
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkType, setLinkType] = useState<IssueLinkType>('relates_to')
  const [targetIssueId, setTargetIssueId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Mock issue links for now - these would come from the API
  const issueLinks: IssueLink[] = []

  const linkTypeLabels = {
    blocks: 'blocks',
    blocked_by: 'is blocked by',
    duplicates: 'duplicates',
    duplicated_by: 'is duplicated by',
    relates_to: 'relates to',
    causes: 'causes',
    caused_by: 'is caused by',
    clones: 'clones',
    cloned_by: 'is cloned by',
    child_of: 'is child of',
    parent_of: 'is parent of',
  }

  const linkTypeColors = {
    blocks: 'text-red-600 bg-red-50',
    blocked_by: 'text-red-600 bg-red-50',
    duplicates: 'text-orange-600 bg-orange-50',
    duplicated_by: 'text-orange-600 bg-orange-50',
    relates_to: 'text-blue-600 bg-blue-50',
    causes: 'text-purple-600 bg-purple-50',
    caused_by: 'text-purple-600 bg-purple-50',
    clones: 'text-green-600 bg-green-50',
    cloned_by: 'text-green-600 bg-green-50',
    child_of: 'text-indigo-600 bg-indigo-50',
    parent_of: 'text-indigo-600 bg-indigo-50',
  }

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetIssueId.trim() || !onLinkCreate || submitting) return

    try {
      setSubmitting(true)
      await onLinkCreate(parseInt(targetIssueId), linkType)
      setTargetIssueId('')
      setSearchQuery('')
      setShowLinkForm(false)
    } catch (error) {
      console.error('Failed to create issue link:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteLink = async (linkId: number) => {
    if (!onLinkDelete || !confirm('Are you sure you want to remove this link?')) return

    try {
      await onLinkDelete(linkId)
    } catch (error) {
      console.error('Failed to delete issue link:', error)
    }
  }

  const getLinkedIssue = (link: IssueLink) => {
    return link.sourceIssueId === issue.id ? link.targetIssue : link.sourceIssue
  }

  const getLinkDirection = (link: IssueLink) => {
    return link.sourceIssueId === issue.id ? 'outbound' : 'inbound'
  }

  const getDisplayLinkType = (link: IssueLink) => {
    const direction = getLinkDirection(link)
    let displayType = link.linkType

    // Flip the relationship for inbound links
    if (direction === 'inbound') {
      const flipMap: Record<IssueLinkType, IssueLinkType> = {
        blocks: 'blocked_by',
        blocked_by: 'blocks',
        duplicates: 'duplicated_by',
        duplicated_by: 'duplicates',
        relates_to: 'relates_to',
        causes: 'caused_by',
        caused_by: 'causes',
        clones: 'cloned_by',
        cloned_by: 'clones',
        child_of: 'parent_of',
        parent_of: 'child_of',
      }
      displayType = flipMap[link.linkType] || link.linkType
    }

    return linkTypeLabels[displayType]
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Issue Links
        </h3>
        <Button
          onClick={() => setShowLinkForm(true)}
          size="sm"
        >
          Link Issue
        </Button>
      </div>

      {/* Link Creation Form */}
      {showLinkForm && (
        <form onSubmit={handleCreateLink} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Type
              </label>
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as IssueLinkType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relates_to">relates to</option>
                <option value="blocks">blocks</option>
                <option value="duplicates">duplicates</option>
                <option value="causes">causes</option>
                <option value="clones">clones</option>
                <option value="child_of">is child of</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Issue ID (e.g., JC-123)
              </label>
              <input
                type="text"
                value={targetIssueId}
                onChange={(e) => setTargetIssueId(e.target.value)}
                placeholder="Enter issue ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              type="submit"
              disabled={submitting || !targetIssueId.trim()}
              size="sm"
            >
              {submitting ? 'Creating...' : 'Create Link'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowLinkForm(false)
                setTargetIssueId('')
                setSearchQuery('')
              }}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Issue Links List */}
      {issueLinks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="mb-4">
            <span className="text-4xl">🔗</span>
          </div>
          <p className="text-sm">No linked issues yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Create relationships between issues to track dependencies and connections.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {issueLinks.map((link) => {
            const linkedIssue = getLinkedIssue(link)
            const displayLinkType = getDisplayLinkType(link)

            if (!linkedIssue) return null

            return (
              <div
                key={link.id}
                className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Link Type */}
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${linkTypeColors[link.linkType]}`}>
                    {displayLinkType}
                  </span>
                </div>

                {/* Linked Issue Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/projects/${projectId}/issues/${linkedIssue.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                    >
                      {linkedIssue.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>JC-{linkedIssue.id}</span>
                    <span className="capitalize">{linkedIssue.type}</span>
                    <span className="capitalize">{linkedIssue.status.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Tips */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Link Types:</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Blocks:</strong> This issue must be completed before the linked issue</p>
          <p><strong>Duplicates:</strong> This issue is a duplicate of the linked issue</p>
          <p><strong>Relates to:</strong> General relationship between issues</p>
          <p><strong>Causes:</strong> This issue causes the problem described in the linked issue</p>
        </div>
      </div>
    </div>
  )
}