import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { IssueLinksService, type IssueLink, type IssueLinkType } from '../../services/api/issue-links.service'
import { useProjects } from '../../hooks/useProjects'
import type { Issue } from '../../types/domain.types'


interface IssueLinksProps {
  issue: Issue
  projectId: string
}

export const IssueLinks = ({ issue, projectId }: IssueLinksProps) => {
  const { projects } = useProjects()
  const currentProject = projects.find(p => p.id === Number(projectId))
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkType, setLinkType] = useState<IssueLinkType>('relates_to')
  const [_targetIssueId, setTargetIssueId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [issueLinks, setIssueLinks] = useState<IssueLink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<Issue[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

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

  // Load issue links on component mount
  useEffect(() => {
    const fetchIssueLinks = async () => {
      try {
        setLoading(true)
        const links = await IssueLinksService.getByIssueId(issue.id)
        setIssueLinks(links)
      } catch (error) {
        console.error('Failed to load issue links:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIssueLinks()
  }, [issue.id])

  // Handle search for issues
  useEffect(() => {
    const searchIssues = async () => {
      // Allow shorter queries for numeric searches (issue IDs)
      const isNumericQuery = /^\d+$/.test(searchQuery.trim()) || /^jc-?\d+$/i.test(searchQuery.trim())
      const minLength = isNumericQuery ? 1 : 3

      if (searchQuery.length >= minLength) {
        try {
          const results = await IssueLinksService.searchIssues(searchQuery, parseInt(projectId))
          // Filter out the current issue and already linked issues
          const linkedIssueIds = new Set([
            issue.id,
            ...issueLinks.map(link =>
              link.sourceIssueId === issue.id ? link.targetIssueId : link.sourceIssueId
            )
          ])
          const filteredResults = results.filter(result => !linkedIssueIds.has(result.id))
          setSearchResults(filteredResults)
          setShowSearchResults(true)
        } catch (error) {
          console.error('Failed to search issues:', error)
          setSearchResults([])
        }
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }

    const timeoutId = setTimeout(searchIssues, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [searchQuery, issue.id, issueLinks, projectId])

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIssue || submitting) return

    try {
      setSubmitting(true)
      const newLink = await IssueLinksService.create({
        sourceIssueId: issue.id,
        targetIssueId: selectedIssue.id,
        linkType,
        createdById: 1, // TODO: Get current user ID
      })

      // Add the new link to the state
      setIssueLinks(prev => [...prev, {
        ...newLink,
        sourceIssue: issue,
        targetIssue: selectedIssue,
        createdBy: { id: 1, name: 'Current User' } // TODO: Get current user
      }])

      // Reset form
      setTargetIssueId('')
      setSearchQuery('')
      setSelectedIssue(null)
      setShowSearchResults(false)
      setShowLinkForm(false)
    } catch (error) {
      console.error('Failed to create issue link:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteLink = async (linkId: number) => {
    if (!confirm('Are you sure you want to remove this link?')) return

    try {
      await IssueLinksService.delete(linkId)
      setIssueLinks(prev => prev.filter(link => link.id !== linkId))
    } catch (error) {
      console.error('Failed to delete issue link:', error)
    }
  }

  const handleSelectIssue = (selectedIssue: Issue) => {
    setSelectedIssue(selectedIssue)
    setTargetIssueId(selectedIssue.id.toString())
    setSearchQuery(selectedIssue.title)
    setShowSearchResults(false)
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
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search and Select Issue
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedIssue(null)
                  setTargetIssueId('')
                }}
                placeholder="Type to search for issues..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((searchIssue) => (
                    <button
                      key={searchIssue.id}
                      type="button"
                      onClick={() => handleSelectIssue(searchIssue)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {searchIssue.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {currentProject?.key || 'JC'}-{searchIssue.id} • {searchIssue.type} • {searchIssue.status.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          searchIssue.type === 'bug' ? 'bg-red-100 text-red-800' :
                          searchIssue.type === 'story' ? 'bg-green-100 text-green-800' :
                          searchIssue.type === 'epic' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {searchIssue.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length > 0 && searchQuery.length < 3 && !/^\d+$/.test(searchQuery.trim()) && !/^jc-?\d+$/i.test(searchQuery.trim()) && (
                <div className="text-xs text-gray-500 mt-1">
                  Type at least 3 characters to search (or use issue ID/key)
                </div>
              )}

              {selectedIssue && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm font-medium text-blue-900">
                    Selected: {selectedIssue.title}
                  </div>
                  <div className="text-xs text-blue-700">
                    {currentProject?.key || 'JC'}-{selectedIssue.id} • {selectedIssue.type}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              type="submit"
              disabled={submitting || !selectedIssue}
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
                setSelectedIssue(null)
                setShowSearchResults(false)
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
                    <span>{currentProject?.key || 'JC'}-{linkedIssue.id}</span>
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