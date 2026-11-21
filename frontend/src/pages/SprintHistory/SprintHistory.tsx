import { TriangleAlert } from 'lucide-react'
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
  done: { color: 'bg-gray-100 text-gray-700', label: 'Done' },
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
    <div data-testid="sprint-card" className="rounded-lg border border-gray-200 bg-white">
      <div className="p-4 sm:p-6">
        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 break-words">{sprint.name}</h3>
            {sprint.goal && (
              <p className="text-sm text-gray-600 mt-0.5 break-words">{sprint.goal}</p>
            )}
          </div>
        </div>

        {/* Dates */}
        <p className="text-sm text-gray-500 mt-2">
          {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
          {duration && <span className="text-gray-400"> · {duration}</span>}
        </p>

        {/* Stat row — stacks 2-up on narrow screens */}
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-4">
          <div className="bg-white px-3 py-2">
            <div className="text-xs text-gray-500">Issues completed</div>
            <div className="text-base font-semibold text-gray-900">
              {sprint.completedIssuesCount} <span className="text-sm font-normal text-gray-500">/ {sprint.totalIssuesCount}</span>
            </div>
          </div>
          <div className="bg-white px-3 py-2">
            <div className="text-xs text-gray-500">Points delivered</div>
            <div className="text-base font-semibold text-gray-900">{sprint.pointsDelivered}</div>
          </div>
          <div className="bg-white px-3 py-2">
            <div className="text-xs text-gray-500">Points committed</div>
            <div className="text-base font-semibold text-gray-900">{sprint.pointsCommitted}</div>
          </div>
          <div className="bg-white px-3 py-2">
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
          <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-600" data-testid="scope-change">
            <TriangleAlert className="size-4 text-gray-500" strokeWidth={1.5} aria-hidden="true" />
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
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading sprint history"
          className="h-64 motion-safe:animate-pulse rounded-lg bg-gray-100"
        />
      </div>
    )
  }

  return (
    <div className="min-w-0 flex-1 bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Sprint history</h1>
        <p className="mt-1 text-sm text-gray-500">What each finished sprint delivered against what it committed to.</p>
      </div>

      <div>
        {sprints.length === 0 ? (
          <div className="bg-white rounded-lg  text-center py-12 px-4">
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
          <div className="space-y-4 sm:space-y-6">
            {sprints.map(sprint => (
              <SprintCard key={sprint.id} sprint={sprint} projectId={projectId ?? ''} />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
