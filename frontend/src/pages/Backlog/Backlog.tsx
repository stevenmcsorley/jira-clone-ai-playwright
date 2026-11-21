import { ClipboardList } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ProjectDescription } from '../../components/ProjectDescription/ProjectDescription'
import { tidyDescription } from '../../utils/projectDescription'
import { moveAnnouncement, sprintMoveTargets } from '../../utils/sprintMove'
import { goalCounter, SPRINT_GOAL_MAX } from '../../utils/sprintGoal'
import { Button } from '../../components/ui/Button'
import { SprintsService, type Sprint } from '../../services/api/sprints.service'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import { useTimerManager } from '../../hooks/useTimerManager'
import { useAuth } from '../../contexts/AuthContext'
import { TimeProgressBar, TimeProgressIndicator } from '../../components/TimeProgressBar'
import { ActiveTimerDisplay } from '../../components/ActiveTimerDisplay'
import { BacklogIssueCard } from '../../components/BacklogIssueCard/BacklogIssueCard'
import { BacklogMoveMenu } from '../../components/BacklogIssueCard/BacklogMoveMenu'
import { getPriorityColor, getPriorityIcon } from '../../components/BacklogIssueCard/issuePriority'
import { BacklogSkeleton } from '../../components/BacklogSkeleton/BacklogSkeleton'
import type { Issue } from '../../types/domain.types'

export const Backlog = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects } = useProjects()
  const { users } = useUsers()
  const { user: currentUser } = useAuth()
  const { handleIssueStatusChange } = useTimerManager()

  const [{ sprints, backlogIssues }, setPlanning] = useState<{ sprints: Sprint[]; backlogIssues: Issue[] }>({
    sprints: [],
    backlogIssues: [],
  })
  const [moveStatus, setMoveStatus] = useState('')
  const pendingMoves = useRef(new Set<number>())
  const moveRevision = useRef(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateSprint, setShowCreateSprint] = useState(false)
  const [newSprintName, setNewSprintName] = useState('')
  const [newSprintGoal, setNewSprintGoal] = useState('')
  const [creating, setCreating] = useState(false)
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null)
  const [showStartSprintModal, setShowStartSprintModal] = useState(false)
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null)
  const [selectedDuration, setSelectedDuration] = useState('2-weeks')
  const [customDuration, setCustomDuration] = useState('')
  const [showClosedSprints, setShowClosedSprints] = useState(false)

  const sprintGoalCounter = goalCounter(newSprintGoal)
  const currentProject = projects.find(p => p.id === Number(projectId))
  const projectKey = currentProject?.key || 'JC'

  const fetchData = async (showLoadingState = true) => {
    if (!projectId) return

    try {
      if (showLoadingState) {
        setLoading(true)
      }
      setError(null)

      const [sprintsData, backlogData] = await Promise.all([
        SprintsService.getByProject(parseInt(projectId)),
        SprintsService.getBacklogIssues(parseInt(projectId))
      ])

      // Sort sprints: future first, then active, then completed (most recent first)
      const sortedSprints = sprintsData.sort((a, b) => {
        if (a.status === 'future' && b.status !== 'future') return -1
        if (b.status === 'future' && a.status !== 'future') return 1
        if (a.status === 'active' && b.status !== 'active') return -1
        if (b.status === 'active' && a.status !== 'active') return 1
        // For completed sprints, sort by end date (most recent first)
        if (a.status === 'completed' && b.status === 'completed') {
          return new Date(b.endDate || b.updatedAt).getTime() - new Date(a.endDate || a.updatedAt).getTime()
        }
        return 0
      })

      setPlanning({ sprints: sortedSprints, backlogIssues: backlogData })
    } catch (err) {
      setError('Failed to load backlog data')
      console.error('Error fetching backlog:', err)
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
    let active = true
    const handleRefresh = (event: CustomEvent) => {
      const { type } = event.detail
      if (type === 'issues' || type === 'sprints') {
        if (projectId && pendingMoves.current.size === 0) {
          const revision = moveRevision.current
          // Directly call the fetch logic here to ensure it runs
          Promise.all([
            SprintsService.getByProject(parseInt(projectId)),
            SprintsService.getBacklogIssues(parseInt(projectId))
          ]).then(([sprintsData, backlogData]) => {
            // A menu move can emit refresh events between its remove and add requests.
            if (!active || revision !== moveRevision.current) return
            const sortedSprints = sprintsData.sort((a, b) => {
              if (a.status === 'future' && b.status !== 'future') return -1
              if (b.status === 'future' && a.status !== 'future') return 1
              if (a.status === 'active' && b.status !== 'active') return -1
              if (b.status === 'active' && a.status !== 'active') return 1
              if (a.status === 'completed' && b.status === 'completed') {
                return new Date(b.endDate || b.updatedAt).getTime() - new Date(a.endDate || a.updatedAt).getTime()
              }
              return 0
            })
            setPlanning({ sprints: sortedSprints, backlogIssues: backlogData })
          }).catch(error => {
            console.error('Error refreshing backlog data:', error)
          })
        }
      }
    }

    window.addEventListener('ossicone-refresh', handleRefresh as EventListener)
    return () => {
      active = false
      window.removeEventListener('ossicone-refresh', handleRefresh as EventListener)
    }
  }, [projectId])

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSprintName.trim() || !projectId || creating) return

    try {
      setCreating(true)
      const newSprint = await SprintsService.create({
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || undefined,
        projectId: parseInt(projectId),
        createdById: currentUser!.id
      })

      setPlanning(prev => ({ ...prev, sprints: [...prev.sprints, newSprint] }))
      setNewSprintName('')
      setNewSprintGoal('')
      setShowCreateSprint(false)
    } catch (error) {
      console.error('Failed to create sprint:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleStartSprintClick = (sprintId: number) => {
    setSelectedSprintId(sprintId)
    setShowStartSprintModal(true)
  }

  const getDurationInDays = (duration: string, customDays?: string) => {
    switch (duration) {
      case '1-day': return 1
      case '1-week': return 7
      case '2-weeks': return 14
      case 'custom': return customDays ? parseInt(customDays) : 14
      default: return 14
    }
  }

  const handleStartSprint = async () => {
    if (!selectedSprintId) return

    const startDate = new Date()
    const endDate = new Date()
    const durationDays = getDurationInDays(selectedDuration, customDuration)
    endDate.setDate(startDate.getDate() + durationDays)

    try {
      const updatedSprint = await SprintsService.startSprint(selectedSprintId, {
        startDate,
        endDate
      })

      setPlanning(prev => ({
        ...prev,
        sprints: prev.sprints.map(sprint => sprint.id === selectedSprintId ? updatedSprint : sprint),
      }))

      setShowStartSprintModal(false)
      setSelectedSprintId(null)
      setSelectedDuration('2-weeks')
      setCustomDuration('')
    } catch (error) {
      console.error('Failed to start sprint:', error)
    }
  }

  const handleCompleteSprint = async (sprintId: number) => {
    try {
      const updatedSprint = await SprintsService.completeSprint(sprintId)

      setPlanning(prev => ({
        ...prev,
        sprints: prev.sprints.map(sprint => sprint.id === sprintId ? updatedSprint : sprint),
      }))
    } catch (error) {
      console.error('Failed to complete sprint:', error)
    }
  }

  const handleAddIssueToSprint = async (sprintId: number, issueId: number) => {
    try {
      await SprintsService.addIssueToSprint(sprintId, issueId)

      // Move issue from backlog to sprint
      const issue = backlogIssues.find(i => i.id === issueId)
      if (issue) {
        setPlanning(prev => ({
          backlogIssues: prev.backlogIssues.filter(i => i.id !== issueId),
          sprints: prev.sprints.map(sprint =>
            sprint.id === sprintId
              ? { ...sprint, issues: [...(sprint.issues || []), { ...issue, sprintId }] }
              : sprint
          ),
        }))
      }
    } catch (error) {
      console.error('Failed to add issue to sprint:', error)
    }
  }

  const handleRemoveIssueFromSprint = async (issueId: number) => {
    try {
      await SprintsService.removeIssueFromSprint(issueId)

      setPlanning(prev => {
        const movedIssue = prev.sprints.flatMap(sprint => sprint.issues || []).find(i => i.id === issueId)
        if (!movedIssue) return prev

        return {
          backlogIssues: [...prev.backlogIssues, { ...movedIssue, sprintId: null }],
          sprints: prev.sprints.map(sprint =>
            sprint.issues?.some(i => i.id === issueId)
              ? { ...sprint, issues: sprint.issues.filter(i => i.id !== issueId) }
              : sprint
          ),
        }
      })
    } catch (error) {
      console.error('Failed to remove issue from sprint:', error)
    }
  }

  const moveIssueToSprint = async (issue: Issue, targetSprintId: number | null) => {
    const target = sprintMoveTargets(issue.sprintId ?? null, sprints).find(({ id }) => id === targetSprintId)
    if (!target || pendingMoves.current.has(issue.id)) return

    pendingMoves.current.add(issue.id)
    moveRevision.current += 1
    setMoveStatus('')
    try {
      if (issue.sprintId != null) {
        await SprintsService.removeIssueFromSprint(issue.id)
      }
      if (targetSprintId !== null) {
        await SprintsService.addIssueToSprint(targetSprintId, issue.id)
      }

      const movedIssue = { ...issue, sprintId: targetSprintId }
      setPlanning(prev => {
        const remainingBacklog = prev.backlogIssues.filter(i => i.id !== issue.id)
        return {
          backlogIssues: targetSprintId === null ? [...remainingBacklog, movedIssue] : remainingBacklog,
          sprints: prev.sprints.map(sprint => {
            if (sprint.id !== targetSprintId && !sprint.issues?.some(i => i.id === issue.id)) return sprint

            const remainingIssues = (sprint.issues || []).filter(i => i.id !== issue.id)
            return {
              ...sprint,
              issues: sprint.id === targetSprintId ? [...remainingIssues, movedIssue] : remainingIssues,
            }
          }),
        }
      })
      setMoveStatus(moveAnnouncement(issue.title, target.label))
    } catch (error) {
      console.error('Failed to move issue:', error)
      setMoveStatus('Could not move the issue')
    } finally {
      pendingMoves.current.delete(issue.id)
    }
  }

  const handleDragStart = (issue: Issue) => {
    setDraggedIssue(issue)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropOnSprint = async (e: React.DragEvent, sprintId: number) => {
    e.preventDefault()
    if (!draggedIssue) return

    await handleAddIssueToSprint(sprintId, draggedIssue.id)
    setDraggedIssue(null)
  }

  const handleDropOnBacklog = async (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedIssue) return

    await handleRemoveIssueFromSprint(draggedIssue.id)
    setDraggedIssue(null)
  }

  if (loading) return <BacklogSkeleton />

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0 flex-1 flex flex-col bg-gray-50">
      <div className="sr-only" role="status" aria-live="polite" data-testid="backlog-move-status">
        {moveStatus}
      </div>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 wrap-anywhere">
              {currentProject?.name} Backlog
            </h1>
            <p className="text-sm text-gray-600 mt-1 max-md:hidden">
              Plan and prioritize your work. Drag issues between backlog and sprints.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/projects/${projectId}/issues/create`} className="max-md:flex-1">
              <Button variant="secondary" className="max-md:w-full max-md:min-h-11">
                Create Issue
              </Button>
            </Link>
            <Button onClick={() => setShowCreateSprint(true)} className="max-md:flex-1 max-md:min-h-11">
              Create Sprint
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6">
        <div className="max-w-full mx-auto space-y-6">

          {/* Create Sprint Form */}
          {showCreateSprint && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
              <form onSubmit={handleCreateSprint} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Create Sprint</h3>
                <div>
                  <label htmlFor="sprintName" className="block text-sm font-medium text-gray-700 mb-1">
                    Sprint Name *
                  </label>
                  <input
                    type="text"
                    id="sprintName"
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                    placeholder="Sprint 1"
                    className="w-full max-md:min-h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="sprintGoal" className="block text-sm font-medium text-gray-700 mb-1">
                    Sprint Goal
                  </label>
                  <input
                    type="text"
                    id="sprintGoal"
                    value={newSprintGoal}
                    onChange={(e) => setNewSprintGoal(e.target.value)}
                    placeholder="One short sentence, e.g. Ship the new onboarding flow"
                    maxLength={SPRINT_GOAL_MAX}
                    aria-describedby="sprintGoalCounter"
                    className="w-full max-md:min-h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p
                    id="sprintGoalCounter"
                    aria-live="polite"
                    className={`mt-1 text-xs ${sprintGoalCounter.nearLimit ? 'text-amber-600' : 'text-gray-500'}`}
                  >
                    {sprintGoalCounter.text}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="max-md:min-h-11" type="submit" disabled={creating || !newSprintName.trim()}>
                    {creating ? 'Creating...' : 'Create Sprint'}
                  </Button>
                  <Button
                    className="max-md:min-h-11"
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCreateSprint(false)
                      setNewSprintName('')
                      setNewSprintGoal('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Active and Future Sprints */}
          {sprints?.filter(sprint => sprint.status !== 'completed').map((sprint) => (
            <div key={sprint.id} className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between max-md:flex-wrap gap-y-3">
                  <div className="flex min-w-0 items-center gap-3 max-md:w-full max-md:flex-wrap gap-y-3">
                    <div className="flex min-w-0 items-center gap-3 max-md:w-full">
                      <h3 className="text-lg font-medium text-gray-900 min-w-0 wrap-anywhere">{sprint.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        sprint.status === 'active' ? 'bg-green-100 text-green-800' :
                        sprint.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {sprint.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 max-md:basis-full">
                      {sprint.issues?.length || 0} issues
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 empty:hidden max-md:w-full">
                    {sprint.status === 'future' && (sprint.issues?.length || 0) > 0 && (
                      <Button
                        size="sm"
                        className="max-md:flex-1 max-md:min-h-11"
                        onClick={() => handleStartSprintClick(sprint.id)}
                      >
                        Start Sprint
                      </Button>
                    )}
                    {sprint.status === 'active' && (
                      <>
                        <Link to={`/projects/${projectId}`} className="max-md:flex-1">
                          <Button size="sm" variant="secondary" className="max-md:w-full max-md:min-h-11">
                            View Board
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="max-md:flex-1 max-md:min-h-11"
                          onClick={() => handleCompleteSprint(sprint.id)}
                        >
                          Complete Sprint
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {tidyDescription(sprint.goal) && (
                  <div className="mt-2 min-w-0 max-w-prose wrap-anywhere">
                    <p className="text-xs font-medium   text-gray-500">Sprint goal</p>
                    <ProjectDescription
                      idPrefix="backlog-sprint-goal"
                      projectId={sprint.id}
                      lines={2}
                      description={sprint.goal}
                    />
                  </div>
                )}
                {(sprint.startDate || sprint.endDate) && (
                  <p className="text-sm text-gray-600 mt-1">
                    {sprint.startDate && (
                      <span>
                        <strong>Started:</strong> {new Date(sprint.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {sprint.startDate && sprint.endDate && <span> • </span>}
                    {sprint.endDate && (
                      <span>
                        <strong>Ends:</strong> {new Date(sprint.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Sprint Issues Drop Zone */}
              <div
                className="p-3 md:p-6 min-h-[100px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnSprint(e, sprint.id)}
              >
                {(sprint.issues?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No issues in this sprint</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Drag issues from backlog to add them
                    </p>
                  </div>
                ) : (
                  <BacklogIssueList
                    sprints={sprints}
                    onMove={moveIssueToSprint}
                    issues={sprint.issues || []}
                    projectId={projectId}
                    projectKey={projectKey}
                    onDragStart={handleDragStart}
                    onRemove={handleRemoveIssueFromSprint}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Backlog Issues */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-gray-900">Backlog</h3>
                  <span className="text-sm text-gray-600">
                    {backlogIssues.length} issues
                  </span>
                </div>
              </div>
            </div>

            {/* Backlog Drop Zone */}
            <div
              className="p-3 md:p-6 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={handleDropOnBacklog}
            >
              {backlogIssues.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="mb-4">
                    <ClipboardList className="size-8 text-gray-400" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <p className="text-sm">No issues in backlog</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create new issues to start planning your sprints
                  </p>
                </div>
              ) : (
                <BacklogIssueList
                  sprints={sprints}
                  onMove={moveIssueToSprint}
                  issues={backlogIssues}
                  projectId={projectId}
                  projectKey={projectKey}
                  onDragStart={handleDragStart}
                  showUpdated
                />
              )}
            </div>
          </div>

          {/* Closed Sprints Section */}
          {(() => {
            const completedSprints = sprints?.filter(sprint => sprint.status === 'completed').slice(0, 5) || []

            if (completedSprints.length === 0) return null

            return (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between max-md:flex-wrap gap-y-3">
                  <button
                    onClick={() => setShowClosedSprints(!showClosedSprints)}
                    className="flex items-center gap-3 hover:bg-gray-100 px-2 py-1 rounded transition-colors max-md:min-h-11 max-md:w-full max-md:flex-wrap"
                  >
                    <h3 className="text-lg font-medium text-gray-900">Closed Sprints</h3>
                    <span className="text-sm text-gray-600 max-md:order-last max-md:basis-full max-md:text-left">
                      {completedSprints.length} sprint{completedSprints.length === 1 ? '' : 's'}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transform transition-transform ${showClosedSprints ? 'rotate-180' : ''}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <Link
                    to={`/projects/${projectId}/reports`}
                    className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors max-md:flex max-md:w-full max-md:min-h-11 max-md:items-center max-md:justify-center"
                  >
                    View Reports
                  </Link>
                </div>

                {showClosedSprints && (
                  <div className="p-4 md:p-6 space-y-4">
                    {completedSprints.map((sprint) => {
                      const totalIssues = sprint.issues?.length || 0
                      const completedIssues = sprint.issues?.filter(issue => issue.status === 'done').length || 0
                      const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0

                      return (
                        <div key={sprint.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between flex-wrap gap-y-3">
                            <div className="flex min-w-0 items-center gap-3 max-md:w-full">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <h4 className="min-w-0 font-medium text-gray-900 wrap-anywhere">{sprint.name}</h4>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                completed
                              </span>
                            </div>
                            <Link to={`/projects/${projectId}/reports`} className="max-md:order-last max-md:w-full">
                              <button className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 max-md:w-full max-md:min-h-11">
                                View Report
                              </button>
                            </Link>
                            <div className="flex basis-full flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 md:mt-2">
                              <span>{totalIssues} issues</span>
                              <span>{completionRate}% completed</span>
                              {sprint.startDate && sprint.endDate && (
                                <span>
                                  {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                                </span>
                              )}
                              {sprint.goal && (
                                <span className="min-w-0 truncate" title={sprint.goal}>{sprint.goal}</span>
                              )}
                            </div>
                          </div>
                          {totalIssues > 0 && (
                            <div className="mt-3">
                              <BacklogIssueList
                                sprints={sprints}
                                onMove={moveIssueToSprint}
                                issues={sprint.issues}
                                projectId={projectId}
                                projectKey={projectKey}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {sprints?.filter(sprint => sprint.status === 'completed').length > 5 && (
                      <div className="text-center pt-2">
                        <Link to={`/projects/${projectId}/reports`}>
                          <button className="text-sm text-blue-600 hover:text-blue-700 px-3 py-2 rounded hover:bg-blue-50 max-md:min-h-11">
                            View All Sprint Reports ({sprints.filter(sprint => sprint.status === 'completed').length} total)
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Start Sprint Modal */}
      {showStartSprintModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Start Sprint</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint Duration
                </label>
                <div className="space-y-2">
                  <label className="flex items-center max-md:min-h-11">
                    <input
                      type="radio"
                      name="duration"
                      value="1-day"
                      checked={selectedDuration === '1-day'}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="mr-2"
                    />
                    <span>1 Day</span>
                  </label>
                  <label className="flex items-center max-md:min-h-11">
                    <input
                      type="radio"
                      name="duration"
                      value="1-week"
                      checked={selectedDuration === '1-week'}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="mr-2"
                    />
                    <span>1 Week (7 days)</span>
                  </label>
                  <label className="flex items-center max-md:min-h-11">
                    <input
                      type="radio"
                      name="duration"
                      value="2-weeks"
                      checked={selectedDuration === '2-weeks'}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="mr-2"
                    />
                    <span>2 Weeks (14 days) - Recommended</span>
                  </label>
                  <label className="flex items-center max-md:min-h-11">
                    <input
                      type="radio"
                      name="duration"
                      value="custom"
                      checked={selectedDuration === 'custom'}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="mr-2"
                    />
                    <span>Custom</span>
                  </label>
                </div>
              </div>

              {selectedDuration === 'custom' && (
                <div>
                  <label htmlFor="customDuration" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Days
                  </label>
                  <input
                    type="number"
                    id="customDuration"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="Enter number of days"
                    min="1"
                    max="365"
                    className="w-full max-md:min-h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="text-sm text-gray-600">
                <strong>Start Date:</strong> {new Date().toLocaleDateString()}<br />
                <strong>End Date:</strong> {
                  new Date(Date.now() + getDurationInDays(selectedDuration, customDuration) * 24 * 60 * 60 * 1000).toLocaleDateString()
                }
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <Button
                className="max-md:min-h-11"
                onClick={handleStartSprint}
                disabled={selectedDuration === 'custom' && (!customDuration || parseInt(customDuration) < 1)}
              >
                Start Sprint
              </Button>
              <Button
                className="max-md:min-h-11"
                variant="secondary"
                onClick={() => {
                  setShowStartSprintModal(false)
                  setSelectedSprintId(null)
                  setSelectedDuration('2-weeks')
                  setCustomDuration('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface BacklogIssueListProps {
  issues: Issue[]
  sprints: Sprint[]
  onMove: (issue: Issue, targetSprintId: number | null) => void
  projectId?: string
  projectKey: string
  showUpdated?: boolean
  onDragStart?: (issue: Issue) => void
  onRemove?: (issueId: number) => void
}

const BacklogIssueList = ({
  issues,
  sprints,
  onMove,
  projectId,
  projectKey,
  showUpdated,
  onDragStart,
  onRemove,
}: BacklogIssueListProps) => {
  const moveMenu = (issue: Issue) => (
    <BacklogMoveMenu
      issue={issue}
      targets={sprintMoveTargets(issue.sprintId ?? null, sprints)}
      onMove={target => onMove(issue, target.id)}
    />
  )

  const removeButton = (issueId: number) => (
    <button
      onClick={() => onRemove?.(issueId)}
      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded max-md:min-h-11"
    >
      Remove
    </button>
  )

  return (
    <>
      <div className="hidden xl:block bg-white rounded-lg ">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
          <div className="col-span-1">Type</div>
          <div className="col-span-1">ID</div>
          <div className="col-span-3">Title</div>
          <div className="col-span-1">Story Points</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-2">Assignee</div>
          <div className="col-span-1">{showUpdated ? 'Updated' : 'Actions'}</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {issues.map((issue) => (
            <div
              key={issue.id}
              draggable={Boolean(onDragStart)}
              onDragStart={onDragStart && (() => onDragStart(issue))}
              className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${onDragStart ? 'cursor-move' : ''}`}
            >
              {/* Type */}
              <div className="col-span-1 flex items-center">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
                  issue.type === 'story' ? 'bg-gray-100 text-gray-700' :
                  issue.type === 'task' ? 'bg-gray-100 text-gray-700' :
                  issue.type === 'bug' ? 'bg-red-100 text-red-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {issue.type}
                </span>
              </div>

              {/* ID */}
              <div className="col-span-1 flex items-center">
                <span className="text-sm font-medium text-gray-500">
                  {projectKey}-{issue.id}
                </span>
              </div>

              {/* Title */}
              <div className="col-span-3 flex items-center">
                <Link
                  to={`/projects/${projectId}/issues/${issue.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                >
                  {issue.title}
                </Link>
              </div>

              {/* Story Points */}
              <div className="col-span-1 flex items-center">
                {(issue.storyPoints !== null && issue.storyPoints !== undefined && issue.storyPoints !== '' && issue.storyPoints !== 0) ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                    {issue.storyPoints}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1 py-1 text-xs font-medium text-gray-400">
                    —
                  </span>
                )}
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  issue.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                  issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  issue.status === 'code_review' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {issue.status === 'todo' ? 'To Do' :
                   issue.status === 'in_progress' ? 'In Progress' :
                   issue.status === 'code_review' ? 'Code Review' :
                   'Done'}
                </span>
              </div>

              {/* Priority */}
              <div className="col-span-1 flex items-center">
                <span className={`text-sm font-bold ${getPriorityColor(issue.priority)}`}>
                  {getPriorityIcon(issue.priority)}
                </span>
              </div>

              {/* Assignee */}
              <div className="col-span-2 flex items-center">
                {issue.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-800">
                        {issue.assignee.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 truncate">
                      {issue.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </div>

              {showUpdated ? (
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(issue.updatedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              ) : (
                <div className="col-span-1 flex flex-col items-start justify-center gap-1">
                  {moveMenu(issue)}
                  {onRemove && removeButton(issue.id)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="xl:hidden space-y-3 p-3 md:p-4">
        {issues.map(issue => (
          <BacklogIssueCard
            key={issue.id}
            issue={issue}
            projectKey={projectKey}
            projectId={projectId}
            showUpdated={showUpdated}
            onDragStart={onDragStart && (() => onDragStart(issue))}
            actions={
              <div className="flex items-center gap-1">
                {moveMenu(issue)}
                {onRemove && removeButton(issue.id)}
              </div>
            }
          />
        ))}
      </div>
    </>
  )
}
