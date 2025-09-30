import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { KanbanBoard } from '../../components/KanbanBoard'
import { Button } from '../../components/ui/Button'
import { useProjects } from '../../hooks/useProjects'
import { SprintsService, type Sprint } from '../../services/api/sprints.service'
import { IssuesService } from '../../services/api/issues.service'
import type { UpdateIssueRequest, Issue } from '../../types/domain.types'

export const ProjectBoard = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useProjects()
  const [searchQuery, setSearchQuery] = useState('')
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Find the current project
  const currentProject = projects.find(p => p.id === Number(projectId))

  const fetchData = async (showLoadingState = true) => {
    if (!projectId) return

    try {
      if (showLoadingState) {
        setLoading(true)
      }
      const sprintsData = await SprintsService.getByProject(parseInt(projectId))
      setSprints(sprintsData)

      // Find active sprint and get its issues
      const activeSprintData = sprintsData.find(sprint => sprint.status === 'active')
      setActiveSprint(activeSprintData || null)

      if (activeSprintData) {
        setIssues(activeSprintData.issues)
      } else {
        // No active sprint = empty board (like real Jira)
        setIssues([])
      }
    } catch (error) {
      console.error('Error fetching board data:', error)
    } finally {
      if (showLoadingState) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  // Listen for WebSocket real-time updates
  useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      const { type } = event.detail
      if (type === 'issues' || type === 'sprints') {
        console.log('🔄 Real-time update detected, refreshing board data...')
        if (projectId) {
          // Directly call the fetch logic here to ensure it runs
          SprintsService.getByProject(parseInt(projectId)).then(sprintsData => {
            setSprints([...sprintsData]) // Force new array reference
            const activeSprintData = sprintsData.find(sprint => sprint.status === 'active')
            setActiveSprint(activeSprintData || null)
            if (activeSprintData) {
              setIssues([...activeSprintData.issues]) // Force new array reference
            } else {
              setIssues([])
            }
            setRefreshKey(prev => prev + 1) // Force re-render
            console.log('✅ Board data refreshed successfully', activeSprintData?.issues?.length, 'issues')
          }).catch(error => {
            console.error('Error refreshing board data:', error)
          })
        }
      }
    }

    window.addEventListener('jira-refresh', handleRefresh as EventListener)
    return () => {
      window.removeEventListener('jira-refresh', handleRefresh as EventListener)
    }
  }, [projectId])

  // Don't render issues until we have the correct project
  const shouldShowIssues = currentProject && !projectsLoading

  const handleIssueUpdate = async (issueId: number, updates: UpdateIssueRequest) => {
    try {
      const updatedIssue = await IssuesService.update(issueId, updates)
      setIssues(prev => prev.map(issue =>
        issue.id === issueId ? updatedIssue : issue
      ))
    } catch (error) {
      console.error('Failed to update issue:', error)
    }
  }

  const handleIssueCreate = () => {
    navigate(`/projects/${projectId}/issues/create`)
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

  const handleCompleteSprint = async () => {
    if (!activeSprint) return

    try {
      await SprintsService.completeSprint(activeSprint.id)
      // Refresh the page data to show no active sprint
      window.location.reload()
    } catch (error) {
      console.error('Failed to complete sprint:', error)
    }
  }

  if (projectsLoading || loading || !currentProject) {
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
    <div className="flex-1 flex flex-col bg-gray-50" data-testid="project-board">
      {/* Board Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4" data-testid="board-header">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="project-title">
              {activeSprint ? `${activeSprint.name} Board` : 'Project Board'}
            </h1>
            {activeSprint ? (
              <div data-testid="active-sprint-info">
                <p className="text-sm text-gray-600 mt-1" data-testid="sprint-details">
                  {activeSprint.goal && `Goal: ${activeSprint.goal}`}
                  {activeSprint.issues.length === 0
                    ? ' • No issues in this sprint'
                    : ` • ${activeSprint.issues.length} issues`
                  }
                </p>
                {(activeSprint.startDate || activeSprint.endDate) && (
                  <p className="text-sm text-gray-500 mt-1" data-testid="sprint-dates">
                    {activeSprint.startDate && (
                      <span data-testid="sprint-start-date">Started: {new Date(activeSprint.startDate).toLocaleDateString()}</span>
                    )}
                    {activeSprint.startDate && activeSprint.endDate && <span> • </span>}
                    {activeSprint.endDate && (
                      <span data-testid="sprint-end-date">Ends: {new Date(activeSprint.endDate).toLocaleDateString()}</span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                No active sprint. <Link to={`/projects/${projectId}/backlog`} className="text-blue-600 hover:text-blue-700">Go to Backlog</Link> to start a sprint.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3" data-testid="board-actions">
            {!activeSprint ? (
              <Link to={`/projects/${projectId}/backlog`}>
                <Button variant="secondary" data-testid="start-sprint-button">
                  Start Sprint
                </Button>
              </Link>
            ) : (
              <Button
                variant="secondary"
                onClick={handleCompleteSprint}
                data-testid="complete-sprint-button"
              >
                Complete Sprint
              </Button>
            )}
            <Link to={`/projects/${projectId}/issues/create`}>
              <Button data-testid="create-issue-button">
                Create Issue
              </Button>
            </Link>
            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4" data-testid="board-controls">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md min-w-0 flex-1 max-w-md" data-testid="search-form">
            <button type="submit" className="text-gray-400 hover:text-gray-600" data-testid="search-button">
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
              data-testid="search-input"
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
      <main className="flex-1 px-6 py-6" data-testid="board-content">
        {shouldShowIssues ? (
          <div data-testid="kanban-board">
            <KanbanBoard
              key={`${currentProject.id}-${refreshKey}`} // Force re-mount when data changes
              project={currentProject}
              issues={issues}
              loading={loading}
              onIssueUpdate={handleIssueUpdate}
              onIssueCreate={handleIssueCreate}
              onIssueEdit={handleIssueEdit}
              onIssueDelete={handleIssueDelete}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-8" data-testid="board-loading">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading board...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}