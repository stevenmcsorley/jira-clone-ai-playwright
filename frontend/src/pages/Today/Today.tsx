import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProjects } from '../../hooks/useProjects'
import { IssuesService } from '../../services/api/issues.service'
import { SprintsService } from '../../services/api/sprints.service'
import type { Issue, Project } from '../../types/domain.types'
import { IssueTypeIcon } from '../../components/IssueTypeIcon'
import { buildToday, summariseSprint } from './today'
import type { SprintSummary } from './today'

const PRIORITY_LABEL: Record<string, string> = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' }

const Section = ({ title, hint, children, testId }: { title: string; hint: string; children: React.ReactNode; testId: string }) => (
  <section className="rounded-lg border border-gray-200 bg-white" data-testid={testId}>
    <div className="border-b border-gray-200 px-4 py-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500">{hint}</p>
    </div>
    {children}
  </section>
)

const Row = ({ issue, project }: { issue: Issue; project?: Project }) => (
  <li>
    <Link to={`/projects/${issue.projectId}/issues/${issue.id}`} className="flex min-h-11 items-center gap-3 px-4 py-2 hover:bg-gray-50" data-testid={`today-issue-${issue.id}`}>
      <IssueTypeIcon type={issue.type} />
      <span className="w-20 shrink-0 font-mono text-xs text-gray-500">{project?.key ?? ''}-{issue.id}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-900">{issue.title}</span>
      <span className={`shrink-0 text-xs ${issue.priority === 'urgent' ? 'font-semibold text-red-600' : 'text-gray-500'}`}>{PRIORITY_LABEL[issue.priority] ?? issue.priority}</span>
      <span className="hidden w-24 shrink-0 truncate text-right text-xs text-gray-500 md:inline">{project?.name}</span>
    </Link>
  </li>
)

export const Today = () => {
  const { user } = useAuth()
  const { projects, loading: projectsLoading } = useProjects()
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [sprints, setSprints] = useState<SprintSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    IssuesService.getAll().then(d => { if (live) setIssues(d) }).catch(e => { if (live) setError(e instanceof Error ? e.message : 'Could not load your work') })
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!issues || projects.length === 0) return
    let live = true
    Promise.all(projects.map(p => SprintsService.getByProject(p.id).then(list => ({ p, list })).catch(() => ({ p, list: [] as never[] }))))
      .then(all => {
        if (!live) return
        const out: SprintSummary[] = []
        for (const { p, list } of all) {
          const active = list.find(s => s.status === 'active')
          if (active) out.push(summariseSprint(p, active, issues.filter(i => i.projectId === p.id)))
        }
        setSprints(out)
      })
    return () => { live = false }
  }, [issues, projects])

  const lists = useMemo(() => buildToday(issues ?? [], user?.id), [issues, user?.id])
  const projectOf = (issue: Issue) => projects.find(p => p.id === issue.projectId)
  const loading = issues === null && !error
  const empty = issues !== null && !lists.inProgress.length && !lists.inReview.length && !lists.fromSkylark.length && !lists.upNext.length

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-3 py-6 sm:px-6" data-testid="today-page">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Today</h1>
        <p className="mt-1 text-sm text-gray-500">What is yours and what is next, across every project.</p>
      </header>

      {error ? (
        <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-red-600" role="alert">{error}</p>
      ) : loading || projectsLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-gray-100" aria-busy="true" />
      ) : (
        <>
          {sprints.length > 0 && (
            <Section title="Active sprints" hint="Where each project stands right now." testId="today-sprints">
              <ul className="divide-y divide-gray-200">
                {sprints.map(s => (
                  <li key={s.sprint.id}>
                    <Link to={`/projects/${s.project.id}`} className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-gray-50">
                      <span className="rounded border border-gray-300 px-1.5 py-0.5 font-mono text-xs text-gray-600">{s.project.key}</span>
                      <span className="min-w-0 basis-full text-sm text-gray-900 sm:basis-0 sm:flex-1"><span className="font-medium">{s.sprint.name}</span>{s.sprint.goal ? <span className="text-gray-500"> · {s.sprint.goal}</span> : null}</span>
                      <span className="text-sm tabular-nums text-gray-700">{s.done} of {s.total} done</span>
                      <span className="w-24 text-right text-xs text-gray-500">{s.daysLeft === null ? '' : s.daysLeft >= 0 ? `${s.daysLeft} days left` : `${-s.daysLeft} days over`}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {lists.inProgress.length > 0 && (
            <Section title="In progress" hint="Assigned to you and started." testId="today-in-progress">
              <ul className="divide-y divide-gray-200">{lists.inProgress.map(i => <Row key={i.id} issue={i} project={projectOf(i)} />)}</ul>
            </Section>
          )}
          {lists.inReview.length > 0 && (
            <Section title="Waiting for review" hint="Finished by someone and waiting for a decision." testId="today-review">
              <ul className="divide-y divide-gray-200">{lists.inReview.map(i => <Row key={i.id} issue={i} project={projectOf(i)} />)}</ul>
            </Section>
          )}
          {lists.fromSkylark.length > 0 && (
            <Section title="From Skylark" hint="Tickets opened from errors that Skylark caught." testId="today-skylark">
              <ul className="divide-y divide-gray-200">{lists.fromSkylark.map(i => <Row key={i.id} issue={i} project={projectOf(i)} />)}</ul>
            </Section>
          )}
          {lists.upNext.length > 0 && (
            <Section title="Up next" hint="Assigned to you, most urgent first." testId="today-next">
              <ul className="divide-y divide-gray-200">{lists.upNext.map(i => <Row key={i.id} issue={i} project={projectOf(i)} />)}</ul>
            </Section>
          )}

          {empty && sprints.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6" data-testid="today-empty">
              <h2 className="text-base font-semibold text-gray-900">Nothing is waiting on you</h2>
              <p className="mt-1 text-sm text-gray-500">Open a project to pick something up, or create the first issue.</p>
              <Link to="/projects" className="btn-primary mt-4">Go to Projects</Link>
            </div>
          )}
          {empty && sprints.length > 0 && <p className="text-sm text-gray-500" data-testid="today-quiet">Nothing is assigned to you right now. Pick something from a sprint above, or from a Backlog.</p>}
        </>
      )}
    </main>
  )
}
