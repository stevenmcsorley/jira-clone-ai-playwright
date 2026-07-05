import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SprintsService, type Sprint } from '../../services/api/sprints.service'
import { useProjects } from '../../hooks/useProjects'
import { IssueTypeIcon } from '../../components/IssueTypeIcon'
import type { Issue, IssueStatus } from '../../types/domain.types'

interface SprintScopeData {
  totalScope: number
  completedWork: number
  remainingWork: number
  completionRate: number
  completedIssuesCount: number
  incompleteIssuesCount: number
  totalIssuesCount: number
}

interface SprintWithMetrics extends Sprint {
  /** Issues completed / total (analytics count when available, else sprint issues). */
  completedIssuesCount: number
  totalIssuesCount: number
  /** Points delivered (done) vs committed (total sprint scope). */
  pointsDelivered: number
  pointsCommitted: number
  /** Issues moved out of the sprint at completion (scope change), when detectable. */
  movedOutCount: number
}

const STATUS_CONFIG: Record<IssueStatus, { color: string; label: string }> = {
  todo: { color: 'bg-gray-100 text-gray-800', label: 'To Do' },
  in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
  code_review: { color: 'bg-purple-100 text-purple-800', label: 'Code Review' },
  done: { color: 'bg-green-100 text-green-800', label: 'Done' },
}

/** Normalise story points (number, numeric string, or t-shirt size) to a number. */
const pointsValue = (storyPoints: Issue['storyPoints']): number => {
  if (storyPoints === null || storyPoints === undefined || storyPoints === '') return 0
  if (typeof storyPoints === 'number') return storyPoints
  if (!isNaN(Number(storyPoints))) return Number(storyPoints)
  const map: Record<string, number> = { XS: 1, S: 3, M: 5, L: 8, XL: 13, XXL: 21 }
  return map[storyPoints] ?? 0
}

const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getSprintDuration = (
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
) => {
  if (!startDate || !endDate) return null
  const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return `${diffDays} day${diffDays === 1 ? '' : 's'}`
}

const StatusPill = ({ status }: { status: IssueStatus }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.todo
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

const SprintCard = ({ sprint, projectId }: { sprint: SprintWithMetrics; projectId: string }) => {
  const [expanded, setExpanded] = useState(false)

  const duration = getSprintDuration(sprint.startDate, sprint.endDate)
  const pct = sprint.pointsCommitted > 0
    ? Math.min(100, Math.round((sprint.pointsDelivered / sprint.pointsCommitted) * 100))
    : 0
  const sortedIssues = [...sprint.issues].sort((a, b) => {
    // Done issues first, then by title
    if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? -1 : 1
    return a.title.localeCompare(b.title)
  })

  return (
    <div data-testid="sprint-card" className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6">
        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 break-words">{sprint.name}</h3>
            {sprint.goal && (
              <p className="text-sm text-gray-600 mt-0.5 break-words">{sprint.goal}</p>
            )}
          </div>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full shrink-0">
            Completed
          </span>
        </div>

        {/* Dates */}
        <p className="text-sm text-gray-500 mt-2">
          {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
          {duration && <span className="text-gray-400"> · {duration}</span>}
        </p>

        {/* Stat row — stacks 2-up on narrow screens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-gray-50 rounded-md px-3 py-2">
            <div className="text-xs text-gray-500">Issues completed</div>
            <div className="text-base font-semibold text-gray-900">
              {sprint.completedIssuesCount} <span className="text-sm font-normal text-gray-500">/ {sprint.totalIssuesCount}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-md px-3 py-2">
            <div className="text-xs text-gray-500">Points delivered</div>
            <div className="text-base font-semibold text-blue-600">{sprint.pointsDelivered}</div>
          </div>
          <div className="bg-gray-50 rounded-md px-3 py-2">
            <div className="text-xs text-gray-500">Points committed</div>
            <div className="text-base font-semibold text-gray-900">{sprint.pointsCommitted}</div>
          </div>
          <div className="bg-gray-50 rounded-md px-3 py-2">
            <div className="text-xs text-gray-500">Completion</div>
            <div className="text-base font-semibold text-gray-900">{pct}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Points delivered vs committed</span>
            <span>{sprint.pointsDelivered} / {sprint.pointsCommitted}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        </div>

        {/* Scope change indicator */}
        {sprint.movedOutCount > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Scope changed: {sprint.movedOutCount} issue{sprint.movedOutCount === 1 ? '' : 's'} removed after start
          </div>
        )}
      </div>

      {/* Collapsible issue list */}
      <div className="border-t border-gray-200">
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between px-4 sm:px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors rounded-b-lg"
        >
          <span>Issues ({sprint.issues.length})</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {expanded && (
          <ul data-testid="sprint-issue-list" className="divide-y divide-gray-100 border-t border-gray-100">
            {sortedIssues.length === 0 ? (
              <li className="px-4 sm:px-6 py-3 text-sm text-gray-500">
                No issues remained in this sprint.
              </li>
            ) : (
              sortedIssues.map(issue => (
                <li key={issue.id}>
                  <Link
                    to={`/projects/${projectId}/issues/${issue.id}`}
                    className="flex items-center gap-3 px-4 sm:px-6 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <IssueTypeIcon type={issue.type} />
                    <span className="flex-1 min-w-0 text-sm text-gray-900 truncate">{issue.title}</span>
                    {pointsValue(issue.storyPoints) > 0 && (
                      <span className="hidden sm:inline-flex text-xs text-gray-500 shrink-0">
                        {pointsValue(issue.storyPoints)} pts
                      </span>
                    )}
                    <StatusPill status={issue.status} />
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

export const SprintHistory = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects } = useProjects()
  const [sprints, setSprints] = useState<SprintWithMetrics[]>([])
  const [loading, setLoading] = useState(true)

  const currentProject = projects.find(p => p.id === Number(projectId))

  useEffect(() => {
    const fetchSprintHistory = async () => {
      if (!projectId) return

      try {
        setLoading(true)
        const sprintsData = await SprintsService.getByProject(parseInt(projectId))

        const completedSprints = await Promise.all(
          sprintsData
            .filter(sprint => sprint.status === 'completed')
            .map(async (sprint): Promise<SprintWithMetrics> => {
              const issues = sprint.issues ?? []
              const doneIssues = issues.filter(issue => issue.status === 'done')

              // Fallbacks computed from the sprint's own issues array
              let pointsDelivered = doneIssues.reduce((sum, i) => sum + pointsValue(i.storyPoints), 0)
              let pointsCommitted = issues.reduce((sum, i) => sum + pointsValue(i.storyPoints), 0)
              let completedIssuesCount = doneIssues.length
              let totalIssuesCount = issues.length
              let movedOutCount = 0

              // Prefer the analytics scope data: for completed sprints it also
              // includes issues moved back to the backlog at completion.
              try {
                const scopeResponse = await fetch(`/api/analytics/sprint-scope/${sprint.id}`)
                if (scopeResponse.ok) {
                  const scope: SprintScopeData = await scopeResponse.json()
                  if (scope.totalIssuesCount > 0) {
                    pointsDelivered = scope.completedWork
                    pointsCommitted = scope.totalScope
                    completedIssuesCount = scope.completedIssuesCount
                    totalIssuesCount = scope.totalIssuesCount
                    // Issues in the original scope but no longer in the sprint
                    // were removed / moved back after the sprint started.
                    movedOutCount = Math.max(0, scope.totalIssuesCount - issues.length)
                  }
                }
              } catch {
                // Analytics unavailable — keep the locally computed fallbacks.
              }

              return {
                ...sprint,
                completedIssuesCount,
                totalIssuesCount,
                pointsDelivered,
                pointsCommitted,
                movedOutCount,
              }
            })
        )

        // Newest first: prefer end date, fall back to last update
        completedSprints.sort((a, b) => {
          const aTime = new Date(a.endDate ?? a.updatedAt).getTime()
          const bTime = new Date(b.endDate ?? b.updatedAt).getTime()
          return bTime - aTime
        })

        setSprints(completedSprints)
      } catch (error) {
        console.error('Error fetching sprint history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSprintHistory()
  }, [projectId])

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
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Sprint History</h1>
            <p className="text-sm text-gray-600 mt-1">
              Completed sprints{currentProject ? ` for ${currentProject.name}` : ''}
            </p>
          </div>
          <Link
            to={`/projects/${projectId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm shrink-0"
          >
            Back to Board
          </Link>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6">
        {sprints.length === 0 ? (
          <div className="bg-white rounded-lg shadow text-center py-12 px-4">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No completed sprints yet</h3>
            <p className="text-gray-600 mb-4">
              Complete your first sprint to see its history and metrics here.
            </p>
            <Link
              to={`/projects/${projectId}/backlog`}
              className="text-blue-600 hover:text-blue-700"
            >
              Go to Backlog to Start a Sprint
            </Link>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {sprints.map(sprint => (
              <SprintCard key={sprint.id} sprint={sprint} projectId={projectId ?? ''} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
