import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { useIssues } from '../../hooks/useIssues'
import type { Issue } from '../../types/domain.types'

export const SearchResults = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const { projects } = useProjects()
  const currentProject = projects.find(p => p.id === Number(projectId))
  const { issues, loading } = useIssues(currentProject?.id)

  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])

  useEffect(() => {
    if (!query.trim() || !issues.length) {
      setFilteredIssues([])
      return
    }

    const searchTerm = query.toLowerCase()
    const filtered = issues.filter(issue =>
      issue.title.toLowerCase().includes(searchTerm) ||
      issue.description?.toLowerCase().includes(searchTerm) ||
      issue.labels?.some(label => label.toLowerCase().includes(searchTerm)) ||
      `${currentProject?.key || 'TIS'}-${issue.id}`.toLowerCase().includes(searchTerm)
    )

    setFilteredIssues(filtered)
  }, [query, issues, currentProject?.key])

  const priorityIcons = {
    low: { icon: '↓', color: 'text-green-600', bg: 'bg-green-50' },
    medium: { icon: '→', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    high: { icon: '↑', color: 'text-orange-600', bg: 'bg-orange-50' },
    urgent: { icon: '⇈', color: 'text-red-600', bg: 'bg-red-50' },
  }

  const statusLabels = {
    todo: 'TO DO',
    in_progress: 'IN PROGRESS',
    code_review: 'CODE REVIEW',
    done: 'DONE'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${projectId}`}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Board
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              Search Results in {currentProject?.name || 'Project'}
            </h1>
          </div>
        </div>

        {query && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              Searching for: <span className="font-medium">"{query}"</span>
              {filteredIssues.length > 0 && (
                <span className="ml-2">({filteredIssues.length} result{filteredIssues.length !== 1 ? 's' : ''})</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!query.trim() ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Enter a search query</h3>
            <p className="text-gray-500">Search for issues by title, description, labels, or issue ID</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.443-.951-5.97-2.491m11.94 0A7.962 7.962 0 0012 15c2.34 0 4.443-.951 5.97-2.491M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">Try adjusting your search terms or check the spelling</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''} found
            </h2>

            {filteredIssues.map((issue) => (
              <Link
                key={issue.id}
                to={`/projects/${projectId}/issues/${issue.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Issue header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 flex items-center justify-center rounded ${priorityIcons[issue.priority].bg}`}>
                        <span className={`text-xs font-bold ${priorityIcons[issue.priority].color}`}>
                          {priorityIcons[issue.priority].icon}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        {currentProject?.key || 'TIS'}-{issue.id}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {statusLabels[issue.status]}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 capitalize">
                        {issue.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-medium text-gray-900 mb-2 hover:text-blue-600">
                      {issue.title}
                    </h3>

                    {/* Description preview */}
                    {issue.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {issue.description}
                      </p>
                    )}

                    {/* Labels */}
                    {issue.labels && issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {issue.labels.map((label, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Assignee and dates */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        {issue.assignee ? (
                          <>
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {issue.assignee.name.charAt(0)}
                              </span>
                            </div>
                            <span>Assigned to {issue.assignee.name}</span>
                          </>
                        ) : (
                          <span>Unassigned</span>
                        )}
                      </div>
                      <span>Updated {new Date(issue.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Right arrow */}
                  <div className="ml-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}