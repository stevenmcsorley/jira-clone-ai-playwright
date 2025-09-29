import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { SprintsService, type Sprint } from '../../services/api/sprints.service'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import { useTimerManager } from '../../hooks/useTimerManager'
import { TimeProgressBar, TimeProgressIndicator } from '../../components/TimeProgressBar'
import { ActiveTimerDisplay } from '../../components/ActiveTimerDisplay'
import type { Issue } from '../../types/domain.types'

export const Backlog = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects } = useProjects()
  const { users } = useUsers()
  const { handleIssueStatusChange } = useTimerManager()

  const [sprints, setSprints] = useState<Sprint[]>([])
  const [backlogIssues, setBacklogIssues] = useState<Issue[]>([])
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

  const currentProject = projects.find(p => p.id === Number(projectId))

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return

      try {
        setLoading(true)
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

        setSprints(sortedSprints)
        setBacklogIssues(backlogData)
      } catch (err) {
        setError('Failed to load backlog data')
        console.error('Error fetching backlog:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
        createdById: 1 // TODO: Get current user
      })

      setSprints(prev => [...prev, newSprint])
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

      setSprints(prev => prev.map(sprint =>
        sprint.id === selectedSprintId ? updatedSprint : sprint
      ))

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

      setSprints(prev => prev.map(sprint =>
        sprint.id === sprintId ? updatedSprint : sprint
      ))
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
        setBacklogIssues(prev => prev.filter(i => i.id !== issueId))
        setSprints(prev => prev.map(sprint =>
          sprint.id === sprintId
            ? { ...sprint, issues: [...(sprint.issues || []), issue] }
            : sprint
        ))
      }
    } catch (error) {
      console.error('Failed to add issue to sprint:', error)
    }
  }

  const handleRemoveIssueFromSprint = async (issueId: number) => {
    try {
      await SprintsService.removeIssueFromSprint(issueId)

      // Move issue from sprint back to backlog
      let movedIssue: Issue | null = null
      setSprints(prev => prev.map(sprint => {
        const issueIndex = (sprint.issues || []).findIndex(i => i.id === issueId)
        if (issueIndex >= 0) {
          movedIssue = (sprint.issues || [])[issueIndex]
          return {
            ...sprint,
            issues: (sprint.issues || []).filter(i => i.id !== issueId)
          }
        }
        return sprint
      }))

      if (movedIssue) {
        setBacklogIssues(prev => [...prev, movedIssue!])
      }
    } catch (error) {
      console.error('Failed to remove issue from sprint:', error)
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

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'story': return '📖'
      case 'task': return '✓'
      case 'bug': return '🐛'
      case 'epic': return '⚡'
      default: return '📝'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return '↓'
      case 'medium': return '→'
      case 'high': return '↑'
      case 'urgent': return '⇈'
      default: return '→'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-orange-600'
      case 'urgent': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading backlog...</p>
        </div>
      </div>
    )
  }

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
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentProject?.name} Backlog
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Plan and prioritize your work. Drag issues between backlog and sprints.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/projects/${projectId}/issues/create`}>
              <Button variant="secondary">
                Create Issue
              </Button>
            </Link>
            <Button onClick={() => setShowCreateSprint(true)}>
              Create Sprint
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-full mx-auto space-y-6">

          {/* Create Sprint Form */}
          {showCreateSprint && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    placeholder="What is the goal of this sprint?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={creating || !newSprintName.trim()}>
                    {creating ? 'Creating...' : 'Create Sprint'}
                  </Button>
                  <Button
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
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-gray-900">{sprint.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      sprint.status === 'active' ? 'bg-green-100 text-green-800' :
                      sprint.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {sprint.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {sprint.issues?.length || 0} issues
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {sprint.status === 'future' && (sprint.issues?.length || 0) > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleStartSprintClick(sprint.id)}
                      >
                        Start Sprint
                      </Button>
                    )}
                    {sprint.status === 'active' && (
                      <>
                        <Link to={`/projects/${projectId}`}>
                          <Button size="sm" variant="secondary">
                            View Board
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteSprint(sprint.id)}
                        >
                          Complete Sprint
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {sprint.goal && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Goal:</strong> {sprint.goal}
                  </p>
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
                className="p-6 min-h-[100px]"
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
                  <div className="space-y-2">
                    {(sprint.issues || []).map((issue) => (
                      <div
                        key={issue.id}
                        draggable
                        onDragStart={() => handleDragStart(issue)}
                        className="relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move"
                      >
                        <span className="text-lg">{getIssueTypeIcon(issue.type)}</span>
                        <span className="text-sm font-medium text-gray-500">
                          {currentProject?.key || 'JC'}-{issue.id}
                        </span>
                        <Link
                          to={`/projects/${projectId}/issues/${issue.id}`}
                          className="flex-1 text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                        >
                          {issue.title}
                        </Link>
                        <span className={`text-sm font-bold ${getPriorityColor(issue.priority)}`}>
                          {getPriorityIcon(issue.priority)}
                        </span>
                        {(issue.storyPoints !== null && issue.storyPoints !== undefined && issue.storyPoints !== '' && issue.storyPoints !== 0) && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                            📊 {issue.storyPoints}
                          </span>
                        )}
                        {issue.assignee && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {issue.assignee.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => handleRemoveIssueFromSprint(issue.id)}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          Remove
                        </button>

                        {/* Time Progress Indicator */}
                        <TimeProgressIndicator issue={issue} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Backlog Issues */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
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
              className="p-6 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={handleDropOnBacklog}
            >
              {backlogIssues.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="mb-4">
                    <span className="text-4xl">📋</span>
                  </div>
                  <p className="text-sm">No issues in backlog</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create new issues to start planning your sprints
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backlogIssues.map((issue) => (
                    <div
                      key={issue.id}
                      draggable
                      onDragStart={() => handleDragStart(issue)}
                      className="relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move"
                    >
                      <span className="text-lg">{getIssueTypeIcon(issue.type)}</span>
                      <span className="text-sm font-medium text-gray-500">
                        {currentProject?.key || 'JC'}-{issue.id}
                      </span>
                      <Link
                        to={`/projects/${projectId}/issues/${issue.id}`}
                        className="flex-1 text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                      >
                        {issue.title}
                      </Link>
                      <span className={`text-sm font-bold ${getPriorityColor(issue.priority)}`}>
                        {getPriorityIcon(issue.priority)}
                      </span>
                      {(issue.storyPoints !== null && issue.storyPoints !== undefined && issue.storyPoints !== '' && issue.storyPoints !== 0) && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                          📊 {issue.storyPoints}
                        </span>
                      )}
                      {issue.assignee && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {issue.assignee.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      {/* Time Progress Indicator */}
                      <TimeProgressIndicator issue={issue} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Closed Sprints Section */}
          {(() => {
            const completedSprints = sprints?.filter(sprint => sprint.status === 'completed').slice(0, 5) || []

            if (completedSprints.length === 0) return null

            return (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <button
                    onClick={() => setShowClosedSprints(!showClosedSprints)}
                    className="flex items-center gap-3 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                  >
                    <h3 className="text-lg font-medium text-gray-900">Closed Sprints</h3>
                    <span className="text-sm text-gray-600">
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
                    className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    View Reports
                  </Link>
                </div>

                {showClosedSprints && (
                  <div className="p-6 space-y-4">
                    {completedSprints.map((sprint) => {
                      const totalIssues = sprint.issues?.length || 0
                      const completedIssues = sprint.issues?.filter(issue => issue.status === 'done').length || 0
                      const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0

                      return (
                        <div key={sprint.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <h4 className="font-medium text-gray-900">{sprint.name}</h4>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                completed
                              </span>
                            </div>
                            <Link to={`/projects/${projectId}/reports`}>
                              <button className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50">
                                View Report
                              </button>
                            </Link>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span>{totalIssues} issues</span>
                            <span>{completionRate}% completed</span>
                            {sprint.startDate && sprint.endDate && (
                              <span>
                                {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                              </span>
                            )}
                            {sprint.goal && (
                              <span className="italic">"{sprint.goal}"</span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {sprints?.filter(sprint => sprint.status === 'completed').length > 5 && (
                      <div className="text-center pt-2">
                        <Link to={`/projects/${projectId}/reports`}>
                          <button className="text-sm text-blue-600 hover:text-blue-700 px-3 py-2 rounded hover:bg-blue-50">
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Start Sprint</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint Duration
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
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
                  <label className="flex items-center">
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
                  <label className="flex items-center">
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
                  <label className="flex items-center">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                onClick={handleStartSprint}
                disabled={selectedDuration === 'custom' && (!customDuration || parseInt(customDuration) < 1)}
              >
                Start Sprint
              </Button>
              <Button
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