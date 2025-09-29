import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SprintsService, type Sprint } from '../../services/api/sprints.service'
import { useProjects } from '../../hooks/useProjects'
import type { Issue } from '../../types/domain.types'

interface SprintWithMetrics extends Sprint {
  completedIssues: Issue[]
  incompleteIssues: Issue[]
  incompleteIssuesCount: number
  totalStoryPoints: number
  completedStoryPoints: number
  velocity: number
}

export const SprintHistory = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects } = useProjects()
  const [sprints, setSprints] = useState<SprintWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSprint, setSelectedSprint] = useState<SprintWithMetrics | null>(null)

  const currentProject = projects.find(p => p.id === Number(projectId))

  useEffect(() => {
    const fetchSprintHistory = async () => {
      if (!projectId) return

      try {
        setLoading(true)
        const sprintsData = await SprintsService.getByProject(parseInt(projectId))

        // Only show completed sprints, with metrics
        const completedSprints = await Promise.all(
          sprintsData
            .filter(sprint => sprint.status === 'completed')
            .map(async sprint => {
              // For completed sprints, get the full scope data including moved issues
              const scopeResponse = await fetch(`/api/analytics/sprint-scope/${sprint.id}`)
              const scopeData = await scopeResponse.json()

              const completedIssues = sprint.issues.filter(issue => issue.status === 'done')
              const incompleteIssues = sprint.issues.filter(issue => issue.status !== 'done')

              // Use story points instead of time estimates, and get total scope from analytics
              const totalStoryPoints = scopeData.totalScope || 0
              const completedStoryPoints = scopeData.completedWork || 0
              // Calculate incomplete issues count: if there's remaining work, there's at least 1 incomplete issue
              const incompleteIssuesCount = scopeData.remainingWork > 0 ? 1 : 0
              const velocity = completedStoryPoints

              return {
                ...sprint,
                completedIssues,
                incompleteIssues: [], // We'll show the count instead since moved issues aren't in sprint.issues
                incompleteIssuesCount,
                totalStoryPoints,
                completedStoryPoints,
                velocity
              }
          })
        )

        const sortedSprints = completedSprints.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) // Most recent first

        setSprints(sortedSprints)
      } catch (error) {
        console.error('Error fetching sprint history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSprintHistory()
  }, [projectId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getSprintDuration = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 'N/A'
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} days`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sprint history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sprint History</h1>
            <p className="text-sm text-gray-600 mt-1">
              View completed sprints and their achievements for {currentProject?.name}
            </p>
          </div>
          <Link
            to={`/projects/${projectId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Board
          </Link>
        </div>
      </div>

      <div className="flex-1 p-6">
        {sprints.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Sprints</h3>
            <p className="text-gray-600 mb-4">
              Complete your first sprint to see sprint history and metrics here.
            </p>
            <Link
              to={`/projects/${projectId}/backlog`}
              className="text-blue-600 hover:text-blue-700"
            >
              Go to Backlog to Start a Sprint
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sprint List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Completed Sprints</h2>
              {sprints.map(sprint => (
                <div
                  key={sprint.id}
                  className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedSprint?.id === sprint.id ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedSprint(sprint)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{sprint.name}</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Completed
                    </span>
                  </div>

                  {sprint.goal && (
                    <p className="text-sm text-gray-600 mb-3">{sprint.goal}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-1 font-medium">
                        {getSprintDuration(sprint.startDate, sprint.endDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Velocity:</span>
                      <span className="ml-1 font-medium text-blue-600">
                        {sprint.velocity} pts
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Completed:</span>
                      <span className="ml-1 font-medium text-green-600">
                        {sprint.completedIssues.length} issues
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Incomplete:</span>
                      <span className="ml-1 font-medium text-orange-600">
                        {sprint.incompleteIssuesCount} issues
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Story Points</span>
                      <span>{sprint.completedStoryPoints} / {sprint.totalStoryPoints}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${sprint.totalStoryPoints > 0 ? (sprint.completedStoryPoints / sprint.totalStoryPoints) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sprint Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {selectedSprint ? (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sprint Details</h2>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">{selectedSprint.name}</h3>
                      {selectedSprint.goal && (
                        <p className="text-gray-600 text-sm mb-3">{selectedSprint.goal}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Started:</span>
                        <div className="font-medium">{formatDate(selectedSprint.startDate)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Completed:</span>
                        <div className="font-medium">{formatDate(selectedSprint.endDate)}</div>
                      </div>
                    </div>

                    {/* Completed Issues */}
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">
                        ✅ Completed Issues ({selectedSprint.completedIssues.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedSprint.completedIssues.map(issue => (
                          <Link
                            key={issue.id}
                            to={`/projects/${projectId}/issues/${issue.id}`}
                            className="block p-2 bg-green-50 rounded border hover:bg-green-100 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">{issue.title}</div>
                                <div className="text-xs text-gray-600">{issue.type} • {issue.priority}</div>
                              </div>
                              {issue.storyPoints && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {issue.storyPoints} pts
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Incomplete Issues */}
                    {selectedSprint.incompleteIssues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-700 mb-2">
                          ⏸️ Incomplete Issues ({selectedSprint.incompleteIssues.length})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedSprint.incompleteIssues.map(issue => (
                            <Link
                              key={issue.id}
                              to={`/projects/${projectId}/issues/${issue.id}`}
                              className="block p-2 bg-orange-50 rounded border hover:bg-orange-100 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">{issue.title}</div>
                                  <div className="text-xs text-gray-600">{issue.type} • {issue.status}</div>
                                </div>
                                {issue.storyPoints && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {issue.storyPoints} pts
                                  </span>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p>Select a sprint to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}