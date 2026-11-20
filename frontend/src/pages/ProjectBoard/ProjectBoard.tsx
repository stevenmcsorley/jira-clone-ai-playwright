import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ProjectDescription } from '../../components/ProjectDescription/ProjectDescription'
import { tidyDescription } from '../../utils/projectDescription'
import { BoardSkeleton } from '../../components/BoardSkeleton'
import { KanbanBoard } from '../../components/KanbanBoard'
import {
  EMPTY_BOARD_FILTERS,
  isRecentLocalMutation,
  markLocalMutation,
  type BoardFilters,
} from '../../components/XStateKanban'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useProjects } from '../../hooks/useProjects'
import { SprintsService, type Sprint } from '../../services/api/sprints.service'
import { IssuesService } from '../../services/api/issues.service'
import type { UpdateIssueRequest, Issue } from '../../types/domain.types'

export const ProjectBoard = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useProjects()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [quickFiltersOpen, setQuickFiltersOpen] = useState(false)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [boardFilters, setBoardFilters] = useState<BoardFilters>(EMPTY_BOARD_FILTERS)
  const [boardMenuOpen, setBoardMenuOpen] = useState(false)

  // Find the current project
  const currentProject = projects.find(p => p.id === Number(projectId))

  // Quick filters (dropdown) fold into the shared boardFilters state so they
  // combine with the assignee/label chips rather than being a parallel system.
  const onlyMyIssuesActive = !!user && boardFilters.assignees.includes(user.id)
  const quickFiltersActive = onlyMyIssuesActive || boardFilters.recentlyUpdated

  const toggleOnlyMyIssues = () => {
    if (!user) return
    setBoardFilters(prev => ({
      ...prev,
      assignees: prev.assignees.includes(user.id)
        ? prev.assignees.filter(a => a !== user.id)
        : [...prev.assignees, user.id],
    }))
  }

  const toggleRecentlyUpdated = () => {
    setBoardFilters(prev => ({ ...prev, recentlyUpdated: !prev.recentlyUpdated }))
  }

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
        // If WE just mutated an issue (e.g. dropped a card), this event is the
        // websocket echo of our own write. The board machine already holds the
        // confirmed state, so a remount (refreshKey bump) would only cause a
        // loading skeleton, scroll reset and card flicker. Refresh the sprint
        // metadata silently instead; other users' changes (outside the echo
        // window) still get the full refresh below.
        const isOwnEcho = isRecentLocalMutation()
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
            if (!isOwnEcho) {
              setRefreshKey(prev => prev + 1) // Force re-render
            }
          }).catch(error => {
            console.error('Error refreshing board data:', error)
          })
        }
      }
    }

    window.addEventListener('ossicone-refresh', handleRefresh as EventListener)
    return () => {
      window.removeEventListener('ossicone-refresh', handleRefresh as EventListener)
    }
  }, [projectId])

  const handleIssueUpdate = async (issueId: number, updates: UpdateIssueRequest) => {
    try {
      markLocalMutation()
      const updatedIssue = await IssuesService.update(issueId, updates)
      markLocalMutation() // echo arrives after the PUT resolves
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
  }

  const handleIssueDelete = (issueId: number) => {
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
    return <BoardSkeleton />
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50" data-testid="project-board">
      {/* Board Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4" data-testid="board-header">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-0">
          <div className="min-w-0">
            <h1 className="min-w-0 text-2xl font-bold text-gray-900 max-md:truncate" title={currentProject.name} data-testid="project-title">
              {activeSprint ? `${activeSprint.name} Board` : 'Project Board'}
            </h1>
            {activeSprint ? (
              <div data-testid="active-sprint-info">
                {tidyDescription(activeSprint.goal) && (
                  <div className="mt-2 min-w-0 max-w-prose wrap-anywhere">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sprint goal</p>
                    <ProjectDescription
                      idPrefix="sprint-goal"
                      projectId={activeSprint.id}
                      lines={2}
                      description={activeSprint.goal}
                    />
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-1" data-testid="sprint-details">
                  {activeSprint.issues.length === 0
                    ? 'No issues in this sprint'
                    : `${activeSprint.issues.length} issues`
                  }
                </p>
                {(activeSprint.startDate || activeSprint.endDate) && (
                  <p className="text-sm text-gray-500 mt-1" data-testid="sprint-dates">
                    {activeSprint.startDate && (
                      <span className="max-md:block" data-testid="sprint-start-date">Started: {new Date(activeSprint.startDate).toLocaleDateString()}</span>
                    )}
                    {activeSprint.startDate && activeSprint.endDate && <span className="max-md:hidden"> • </span>}
                    {activeSprint.endDate && (
                      <span className="max-md:block" data-testid="sprint-end-date">Ends: {new Date(activeSprint.endDate).toLocaleDateString()}</span>
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
          <div className="flex items-center gap-3 max-md:flex-wrap" data-testid="board-actions">
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
            <Link to={`/projects/${projectId}/issues/create`} className="max-md:order-first max-md:w-full">
              <Button className="max-md:w-full max-md:min-h-11" data-testid="create-issue-button">
                Create Issue
              </Button>
            </Link>
            <div className="relative max-md:ml-auto">
              <button
                type="button"
                onClick={() => setBoardMenuOpen(open => !open)}
                className="w-8 h-8 max-md:min-h-11 max-md:min-w-11 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center"
                title="Board actions"
                aria-label="Board actions"
                aria-expanded={boardMenuOpen}
              >
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {boardMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setBoardMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-52 max-md:max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-md shadow-lg py-1">
                    {activeSprint && (
                      <button
                        onClick={() => { setBoardMenuOpen(false); handleCompleteSprint() }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Complete sprint
                      </button>
                    )}
                    <Link to={`/projects/${projectId}/backlog`} onClick={() => setBoardMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Backlog
                    </Link>
                    <Link to={`/projects/${projectId}/reports`} onClick={() => setBoardMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Reports
                    </Link>
                    <Link to={`/projects/${projectId}/history`} onClick={() => setBoardMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Sprint history
                    </Link>
                    <Link to={`/projects/${projectId}/settings`} onClick={() => setBoardMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Project settings
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center" data-testid="board-controls">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md min-w-0 max-md:w-full md:flex-1 md:max-w-md" data-testid="search-form">
            <button type="submit" className="text-gray-400 hover:text-gray-600 max-md:inline-grid max-md:place-items-center max-md:min-h-11 max-md:min-w-11" data-testid="search-button">
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

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setQuickFiltersOpen(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md max-md:min-h-11 max-md:min-w-11 ${
                quickFiltersActive
                  ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              data-testid="quick-filters-button"
              aria-haspopup="menu"
              aria-expanded={quickFiltersOpen}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Quick Filters
              {quickFiltersActive && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {(onlyMyIssuesActive ? 1 : 0) + (boardFilters.recentlyUpdated ? 1 : 0)}
                </span>
              )}
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {quickFiltersOpen && (
              <>
                {/* Click-away backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setQuickFiltersOpen(false)}
                  data-testid="quick-filters-backdrop"
                />
                <div
                  className="absolute left-0 top-full mt-1 z-20 w-56 max-md:max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-md shadow-lg py-1"
                  role="menu"
                  data-testid="quick-filters-menu"
                >
                  <button
                    onClick={toggleOnlyMyIssues}
                    disabled={!user}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    role="menuitemcheckbox"
                    aria-checked={onlyMyIssuesActive}
                    data-testid="quick-filter-only-my-issues"
                  >
                    Only My Issues
                    {onlyMyIssuesActive && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={toggleRecentlyUpdated}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    role="menuitemcheckbox"
                    aria-checked={boardFilters.recentlyUpdated}
                    data-testid="quick-filter-recently-updated"
                  >
                    Recently Updated
                    {boardFilters.recentlyUpdated && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Board Content */}
      <main className="flex-1 px-6 py-6" data-testid="board-content">
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
            filters={boardFilters}
            onFiltersChange={setBoardFilters}
            activeSprintId={activeSprint?.id ?? null}
          />
        </div>
      </main>
    </div>
  )
}