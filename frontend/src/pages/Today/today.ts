import type { Issue, Project } from '../../types/domain.types'
import type { Sprint } from '../../services/api/sprints.service'

const PRIORITY: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

export interface TodayLists {
  inProgress: Issue[]
  inReview: Issue[]
  fromSkylark: Issue[]
  upNext: Issue[]
}

const byPriority = (a: Issue, b: Issue) => (PRIORITY[a.priority] ?? 9) - (PRIORITY[b.priority] ?? 9) || a.id - b.id

/** Work for one person: what they have started, what waits for review, what Skylark opened, and what is next. */
export const buildToday = (issues: Issue[], userId: number | undefined): TodayLists => {
  const open = issues.filter(i => i.status !== 'done')
  const mine = open.filter(i => userId !== undefined && i.assigneeId === userId)
  return {
    inProgress: mine.filter(i => i.status === 'in_progress').sort(byPriority),
    inReview: open.filter(i => i.status === 'code_review').sort(byPriority),
    fromSkylark: open.filter(i => (i.labels ?? []).includes('skylark')).sort(byPriority),
    upNext: mine.filter(i => i.status === 'todo').sort(byPriority).slice(0, 8),
  }
}

export interface SprintSummary {
  project: Project
  sprint: Sprint
  total: number
  done: number
  daysLeft: number | null
}

export const summariseSprint = (project: Project, sprint: Sprint, issues: Issue[], now = Date.now()): SprintSummary => {
  const inSprint = issues.filter(i => i.sprintId === sprint.id)
  const end = sprint.endDate ? new Date(sprint.endDate).getTime() : null
  return {
    project,
    sprint,
    total: inSprint.length,
    done: inSprint.filter(i => i.status === 'done').length,
    daysLeft: end === null ? null : Math.ceil((end - now) / 86400000),
  }
}
