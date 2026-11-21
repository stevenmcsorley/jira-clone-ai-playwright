import { useEffect, useMemo, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { useIssues } from '../../hooks/useIssues'
import { Pagination } from '../../components/Pagination/Pagination'
import { paginate } from '../../utils/pagination'

const SEARCH_PAGE_SIZE = 20

export const SearchResults = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const previousQuery = useRef(query)
  const resultsHeading = useRef<HTMLHeadingElement>(null)

  const { projects, loading: projectsLoading } = useProjects()
  const currentProject = projects.find(p => p.id === Number(projectId))
  const currentProjectId = currentProject?.id
  const previousProjectId = useRef(currentProjectId)
  const { issues, loading, error } = useIssues(currentProjectId)
  const projectKey = currentProject?.key || 'TIS'

  const filteredIssues = useMemo(() => {
    if (!query.trim() || !issues.length) return []

    const searchTerm = query.toLowerCase()
    return issues.filter(issue =>
      issue.title.toLowerCase().includes(searchTerm) ||
      issue.description?.toLowerCase().includes(searchTerm) ||
      issue.labels?.some(label => label.toLowerCase().includes(searchTerm)) ||
      `${projectKey}-${issue.id}`.toLowerCase().includes(searchTerm)
    )
  }, [query, issues, projectKey])

  const urlPage = searchParams.get('page')
  const requestedPage = /^\d+$/.test(urlPage ?? '') ? Number(urlPage) : 1
  const { items: visibleIssues, page, pageCount, start, end, total } =
    paginate(filteredIssues, requestedPage, SEARCH_PAGE_SIZE)

  useEffect(() => {
    const queryChanged = previousQuery.current !== query
    const projectChanged = previousProjectId.current !== currentProjectId
    previousQuery.current = query
    previousProjectId.current = currentProjectId
    // The issue hook starts fetching the new project after this render.
    if (!queryChanged && (projectChanged || projectsLoading || loading || error)) return

    const canonicalPage = queryChanged || page === 1 ? null : String(page)
    if (urlPage === canonicalPage) return

    const params = new URLSearchParams(searchParams)
    if (canonicalPage === null) params.delete('page')
    else params.set('page', canonicalPage)
    setSearchParams(params, { replace: true })
  }, [query, currentProjectId, projectsLoading, loading, error, page, urlPage, searchParams, setSearchParams])

  const changePage = (nextPage: number) => {
    if (nextPage === page) return

    const params = new URLSearchParams(searchParams)
    if (nextPage === 1) params.delete('page')
    else params.set('page', String(nextPage))
    setSearchParams(params)
    resultsHeading.current?.scrollIntoView?.({ block: "start" })
  }

  const priorityIcons = {
    low: { icon: '↓', color: 'text-gray-500', bg: 'bg-gray-100' },
    medium: { icon: '→', color: 'text-gray-600', bg: 'bg-gray-100' },
    high: { icon: '↑', color: 'text-gray-900', bg: 'bg-gray-200' },
    urgent: { icon: '⇈', color: 'text-red-600', bg: 'bg-red-50' },
  }

  const statusLabels = {
    todo: 'TO DO',
    in_progress: 'IN PROGRESS',
    code_review: 'CODE REVIEW',
    done: 'DONE'
  }

  if (projectsLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div role="status" aria-busy="true" aria-label="Searching" className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
          {[1, 2, 3].map(row => (
            <div key={row} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 motion-safe:animate-pulse">
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-5 w-2/3 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <Link
              to={`/projects/${projectId}`}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Board
            </Link>
            <h1 className="min-w-0 wrap-anywhere text-xl font-bold text-gray-900">
              Search Results in {currentProject?.name || 'Project'}
            </h1>
          </div>
        </div>

        {query && (
          <div className="mt-2">
            <p className="wrap-anywhere text-sm text-gray-600">
              Searching for: <span className="font-medium">"{query}"</span>
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {!query.trim() ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Enter a search query</h3>
            <p className="text-gray-500">Search for issues by title, description, labels, or issue ID</p>
          </div>
        ) : total === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.443-.951-5.97-2.491m11.94 0A7.962 7.962 0 0012 15c2.34 0 4.443-.951 5.97-2.491M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">Try adjusting your search terms or check the spelling</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 ref={resultsHeading} className="text-lg font-medium text-gray-900 mb-4">
              {pageCount > 1 ? `Showing ${start}-${end} of ${total} results` : `${total} result${total === 1 ? '' : 's'}`}
            </h2>

            {visibleIssues.map((issue) => (
              <Link
                key={issue.id}
                to={`/projects/${projectId}/issues/${issue.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-6  transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 wrap-anywhere">
                    {/* Issue header */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <div className={`w-5 h-5 shrink-0 flex items-center justify-center rounded ${priorityIcons[issue.priority].bg}`}>
                        <span className={`text-xs font-bold ${priorityIcons[issue.priority].color}`}>
                          {priorityIcons[issue.priority].icon}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        {projectKey}-{issue.id}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {statusLabels[issue.status]}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 capitalize">
                        {issue.type}
                      </span>
                      {(issue.storyPoints !== null && issue.storyPoints !== undefined && issue.storyPoints !== '' && issue.storyPoints !== 0) && (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                          {issue.storyPoints} pts
                        </span>
                      )}
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
                            className="min-w-0 max-w-full text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Assignee and dates */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
                      <div className="flex min-w-0 items-center gap-2">
                        {issue.assignee ? (
                          <>
                            <div className="w-6 h-6 shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-800">
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
                  <div className="ml-4 shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={changePage}
              label="Search results pages"
              className="mt-6"
            />
          </div>
        )}
      </div>
    </div>
  )
}
