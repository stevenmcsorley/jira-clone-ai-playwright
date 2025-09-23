import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { KanbanBoard } from '../../components/KanbanBoard'
import { Button } from '../../components/ui/Button'
import { useProjects } from '../../hooks/useProjects'
import { useIssues } from '../../hooks/useIssues'
import type { UpdateIssueRequest, Issue } from '../../types/domain.types'

export const ProjectBoard = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useProjects()
  const [searchQuery, setSearchQuery] = useState('')

  // Find the current project
  const currentProject = projects.find(p => p.id === Number(projectId))

  const {
    issues,
    loading: issuesLoading,
    updateIssue,
    createIssue
  } = useIssues(currentProject?.id)

  const handleIssueUpdate = async (issueId: number, updates: UpdateIssueRequest) => {
    try {
      await updateIssue(issueId, updates)
    } catch (error) {
      console.error('Failed to update issue:', error)
    }
  }

  const handleIssueCreate = () => {
    // Navigate to create issue page
  }

  const handleIssueEdit = (issue: Issue) => {
    console.log('Edit issue:', issue)
  }

  const handleIssueDelete = (issueId: number) => {
    console.log('Delete issue:', issueId)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/projects/${projectId}/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  if (projectsLoading || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Board Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Board</h1>
          <div className="flex items-center gap-3">
            <Link to={`/projects/${projectId}/issues/create`}>
              <Button
                data-testid="create-issue-button"
              >
                Create Issue
              </Button>
            </Link>
            <Button
              variant="secondary"
              data-testid="release-button"
            >
              Release
            </Button>
            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md min-w-0 flex-1 max-w-md">
            <button type="submit" className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 flex-1 min-w-0"
            />
          </form>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Quick Filters
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <main className="flex-1 px-6 py-6">
        <KanbanBoard
          project={currentProject}
          issues={issues}
          loading={issuesLoading}
          onIssueUpdate={handleIssueUpdate}
          onIssueCreate={handleIssueCreate}
          onIssueEdit={handleIssueEdit}
          onIssueDelete={handleIssueDelete}
        />
      </main>
    </div>
  )
}