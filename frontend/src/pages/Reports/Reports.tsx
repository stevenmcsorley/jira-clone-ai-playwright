import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SprintsService, type Sprint } from '../../services/api/sprints.service'
import { useProjects } from '../../hooks/useProjects'
import { Button } from '../../components/ui/Button'

export const Reports = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects } = useProjects()

  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)

  const currentProject = projects.find(p => p.id === Number(projectId))

  useEffect(() => {
    const fetchSprints = async () => {
      if (!projectId) return

      try {
        setLoading(true)
        setError(null)

        const sprintsData = await SprintsService.getByProject(parseInt(projectId))
        // Show completed sprints first, then active, then future
        const sortedSprints = sprintsData.sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return -1
          if (b.status === 'completed' && a.status !== 'completed') return 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        setSprints(sortedSprints)

        // Auto-select the first completed sprint if available
        const completedSprints = sortedSprints.filter(s => s.status === 'completed')
        if (completedSprints.length > 0) {
          setSelectedSprint(completedSprints[0])
        }
      } catch (err) {
        setError('Failed to load sprint reports')
        console.error('Error fetching sprints:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSprints()
  }, [projectId])

  const getSprintDuration = (sprint: Sprint) => {
    if (!sprint.startDate || !sprint.endDate) return 'Not started'
    const start = new Date(sprint.startDate)
    const end = new Date(sprint.endDate)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`
  }

  const getSprintStats = (sprint: Sprint) => {
    const totalIssues = sprint.issues?.length || 0
    const completedIssues = sprint.issues?.filter(issue => issue.status === 'done').length || 0
    const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0

    const totalEstimate = sprint.issues?.reduce((sum, issue) => sum + (issue.estimate || 0), 0) || 0
    const completedEstimate = sprint.issues?.filter(issue => issue.status === 'done')
      .reduce((sum, issue) => sum + (issue.estimate || 0), 0) || 0

    return {
      totalIssues,
      completedIssues,
      completionRate,
      totalEstimate,
      completedEstimate,
      velocity: completedEstimate
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'active':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
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
    <div className="flex-1 flex bg-gray-50">
      {/* Sprint List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Sprint Reports</h2>
          <p className="text-sm text-gray-600 mt-1">
            {currentProject?.name} - {sprints.length} sprints
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sprints.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500 text-sm">No sprints found</p>
              <Link to={`/projects/${projectId}/backlog`}>
                <Button size="sm" className="mt-2">
                  Create Sprint
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sprints.map((sprint) => {
                const stats = getSprintStats(sprint)
                const isSelected = selectedSprint?.id === sprint.id

                return (
                  <button
                    key={sprint.id}
                    onClick={() => setSelectedSprint(sprint)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(sprint.status)}
                        <span className="font-medium text-sm text-gray-900">
                          {sprint.name}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sprint.status === 'completed' ? 'bg-green-100 text-green-800' :
                        sprint.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {sprint.status}
                      </span>
                    </div>

                    {sprint.status === 'completed' && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Completion: {stats.completionRate}%</div>
                        <div>Velocity: {stats.velocity} points</div>
                      </div>
                    )}

                    {sprint.startDate && (
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(sprint.startDate).toLocaleDateString()}
                        {sprint.endDate && ` - ${new Date(sprint.endDate).toLocaleDateString()}`}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sprint Details */}
      <div className="flex-1 flex flex-col">
        {selectedSprint ? (
          <>
            {/* Sprint Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(selectedSprint.status)}
                    <h1 className="text-2xl font-bold text-gray-900">
                      {selectedSprint.name}
                    </h1>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      selectedSprint.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedSprint.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedSprint.status}
                    </span>
                  </div>

                  {selectedSprint.goal && (
                    <p className="text-gray-600 mb-2">
                      <strong>Goal:</strong> {selectedSprint.goal}
                    </p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>Duration: {getSprintDuration(selectedSprint)}</span>
                    {selectedSprint.startDate && (
                      <span>
                        {new Date(selectedSprint.startDate).toLocaleDateString()}
                        {selectedSprint.endDate && ` - ${new Date(selectedSprint.endDate).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>

                {selectedSprint.status === 'active' && (
                  <Link to={`/projects/${projectId}`}>
                    <Button variant="secondary">
                      View Board
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Sprint Metrics */}
            <div className="bg-white border-b border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sprint Metrics</h3>

              {(() => {
                const stats = getSprintStats(selectedSprint)
                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalIssues}</div>
                      <div className="text-sm text-gray-600">Total Issues</div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-900">{stats.completedIssues}</div>
                      <div className="text-sm text-green-600">Completed</div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-900">{stats.completionRate}%</div>
                      <div className="text-sm text-blue-600">Completion Rate</div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-900">{stats.velocity}</div>
                      <div className="text-sm text-purple-600">Velocity (Points)</div>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Sprint Issues */}
            <div className="flex-1 overflow-auto p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Issues in Sprint</h3>

              {selectedSprint.issues && selectedSprint.issues.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimate</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSprint.issues.map((issue) => (
                        <tr key={issue.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link
                              to={`/projects/${projectId}/issues/${issue.id}`}
                              className="flex items-center gap-3 hover:text-blue-600"
                            >
                              <span className="text-sm font-medium text-gray-500">
                                {currentProject?.key || 'JC'}-{issue.id}
                              </span>
                              <span className="text-sm text-gray-900 truncate max-w-xs">
                                {issue.title}
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900 capitalize">{issue.type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              issue.status === 'done' ? 'bg-green-100 text-green-800' :
                              issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {issue.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {issue.assignee ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-white">
                                    {issue.assignee.name.charAt(0)}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-900">{issue.assignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">
                              {issue.estimate ? `${issue.estimate} points` : '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No issues in this sprint</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.707 4.293a1 1 0 00-1.414 1.414L7.586 13a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L9 10.172 6.707 9.707z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sprint Reports</h3>
              <p className="text-gray-500 mb-4">
                Select a sprint from the left to view its report
              </p>
              {sprints.length === 0 && (
                <Link to={`/projects/${projectId}/backlog`}>
                  <Button>
                    Create Your First Sprint
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}