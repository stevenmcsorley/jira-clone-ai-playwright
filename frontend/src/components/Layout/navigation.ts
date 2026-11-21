/**
 * Two levels, each with one job.
 *   Workspace: Today (what is yours and next), Projects, Agents.
 *   Project:   Board, Backlog, Issues, Insights (reports and sprint history), Docs (wiki and repository), Settings.
 */
export interface NavTab {
  to: string
  label: string
  match: (pathname: string) => boolean
}

export const workspaceTabs: NavTab[] = [
  { to: '/today', label: 'Today', match: p => p === '/today' },
  { to: '/projects', label: 'Projects', match: p => p === '/projects' || p === '/projects/create' },
  { to: '/agents', label: 'Agents', match: p => p === '/agents' || p === '/ai-agents' },
]

const isReports = (id: string, p: string) => p.startsWith(`/projects/${id}/reports`)
const isHistory = (id: string, p: string) => p.startsWith(`/projects/${id}/history`)
const isWiki = (id: string, p: string) => p.startsWith(`/projects/${id}/wiki`)
const isRepo = (id: string, p: string) => p.startsWith(`/projects/${id}/repository`)

export const projectTabs = (id: string): NavTab[] => [
  { to: `/projects/${id}`, label: 'Board', match: p => p === `/projects/${id}` },
  { to: `/projects/${id}/backlog`, label: 'Backlog', match: p => p.startsWith(`/projects/${id}/backlog`) },
  { to: `/projects/${id}/issues`, label: 'Issues', match: p => p.startsWith(`/projects/${id}/issues`) || p.startsWith(`/projects/${id}/search`) },
  { to: `/projects/${id}/reports`, label: 'Insights', match: p => isReports(id, p) || isHistory(id, p) },
  { to: `/projects/${id}/wiki`, label: 'Docs', match: p => isWiki(id, p) || isRepo(id, p) },
  { to: `/projects/${id}/settings`, label: 'Settings', match: p => p.startsWith(`/projects/${id}/settings`) },
]

/** A second row of tabs for the two tabs that hold more than one page. */
export const projectSubTabs = (id: string, pathname: string): NavTab[] | null => {
  if (isReports(id, pathname) || isHistory(id, pathname)) {
    const report = (slug: string, label: string): NavTab => ({
      to: `/projects/${id}/reports/${slug}`,
      label,
      match: p => p.startsWith(`/projects/${id}/reports/${slug}`),
    })
    return [
      { to: `/projects/${id}/reports`, label: 'Overview', match: p => p === `/projects/${id}/reports` || p === `/projects/${id}/reports/` },
      report('burndown', 'Burndown'),
      report('burnup', 'Burnup'),
      report('velocity', 'Velocity'),
      report('cumulative-flow', 'Cumulative flow'),
      report('cycle-time', 'Cycle time'),
      { to: `/projects/${id}/history`, label: 'Sprint history', match: p => isHistory(id, p) },
    ]
  }
  if (isWiki(id, pathname) || isRepo(id, pathname)) {
    return [
      { to: `/projects/${id}/wiki`, label: 'Wiki', match: p => isWiki(id, p) },
      { to: `/projects/${id}/repository`, label: 'Repository', match: p => isRepo(id, p) },
    ]
  }
  return null
}
