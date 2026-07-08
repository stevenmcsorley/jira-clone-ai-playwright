/**
 * Shared Ossicone MCP tool definitions.
 *
 * The same tools back two transports:
 *   - index.js  stdio, authed by a single env token (OSSICONE_API_TOKEN)
 *   - http.js   remote Streamable-HTTP, authed by a per-request Bearer token
 *
 * So the tool bodies never see a token directly — they call an injected `api()`
 * that's already bound to the right base URL + token. makeApi()/buildServer()
 * wire that up for each transport.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

/** Build an `api(path, {method, body})` bound to a base URL + token (+ optional workspace). */
export function makeApi(baseUrl, token, workspaceId) {
  const base = String(baseUrl || '').replace(/\/$/, '')
  return async function api(path, { method = 'GET', body } = {}) {
    const response = await fetch(`${base}/api${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(workspaceId ? { 'X-Workspace-Id': workspaceId } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await response.text()
    let data
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }
    if (!response.ok) {
      const message = data?.message
        ? Array.isArray(data.message) ? data.message.join('; ') : data.message
        : `${response.status} ${response.statusText}`
      throw new Error(`Ossicone API error on ${method} ${path}: ${message}`)
    }
    return data
  }
}

const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] })
const fail = (error) => ({
  isError: true,
  content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
})

const run = (fn) => async (args) => {
  try {
    return ok(await fn(args))
  } catch (error) {
    return fail(error)
  }
}

// Trim issue objects so tool output stays readable
const slimIssue = (issue) => ({
  id: issue.id,
  title: issue.title,
  type: issue.type,
  status: issue.status,
  priority: issue.priority,
  storyPoints: issue.storyPoints ?? null,
  estimate: issue.estimate ?? null,
  labels: issue.labels ?? [],
  assignee: issue.assignee ? { id: issue.assignee.id, name: issue.assignee.name } : null,
  sprintId: issue.sprintId ?? null,
  epicId: issue.epicId ?? null,
})

const ISSUE_STATUSES = ['todo', 'in_progress', 'code_review', 'done']
const ISSUE_TYPES = ['story', 'task', 'bug', 'epic']
const ISSUE_PRIORITIES = ['low', 'medium', 'high', 'urgent']

/** Register every Ossicone tool on `server`, calling the injected `api`. */
export function registerTools(server, api) {
  // Per-server identity cache. Kept INSIDE registerTools so each built server
  // (one per HTTP request, each with its own token) gets an isolated cache and
  // never leaks one caller's identity to the next.
  let cachedMe = null
  async function me() {
    if (!cachedMe) cachedMe = await api('/auth/me')
    return cachedMe
  }

  // ---------- Workspace context ----------

  server.registerTool(
    'get_workspace',
    { description: 'The workspace this MCP connection operates in (all other tools are scoped to it), with your role and the member list.' },
    run(async () => {
      const [current, members] = await Promise.all([
        api('/workspaces/current'),
        api('/workspaces/current/members').catch(() => []),
      ])
      return {
        workspace: { id: current.id, name: current.name, yourRole: current.role },
        members: members.map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email, role: m.role })),
        note: 'API tokens are bound to one workspace. To work in a different workspace, create a token there (AI Agent page) and register a second MCP server with it.',
      }
    })
  )

  server.registerTool(
    'list_workspaces',
    { description: 'All workspaces the token owner belongs to (for context — this connection stays scoped to its own workspace).' },
    run(async () => {
      const workspaces = await api('/workspaces')
      return workspaces.map(w => ({ id: w.id, name: w.name, role: w.role }))
    })
  )

  // ---------- Projects & people ----------

  server.registerTool(
    'list_projects',
    { description: 'List all projects with id, name, key and lead.' },
    run(async () => {
      const projects = await api('/projects')
      return projects.map(p => ({
        id: p.id, name: p.name, key: p.key, description: p.description,
        lead: p.lead ? { id: p.lead.id, name: p.lead.name } : null,
      }))
    })
  )

  server.registerTool(
    'create_project',
    {
      description: 'Create a new project. The key is a short uppercase identifier like "OSS".',
      inputSchema: {
        name: z.string().describe('Project name'),
        key: z.string().describe('Short uppercase project key, e.g. "RADAR"'),
        description: z.string().optional(),
      },
    },
    run(async ({ name, key, description }) => {
      const lead = await me()
      return api('/projects', { method: 'POST', body: { name, key: key.toUpperCase(), description, leadId: lead.id } })
    })
  )

  server.registerTool(
    'list_users',
    { description: 'List all users (for assigning issues).' },
    run(async () => {
      const users = await api('/users')
      return users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    })
  )

  // ---------- Board & issues ----------

  server.registerTool(
    'get_board',
    {
      description: 'Get the project board: issues grouped by status column, plus the active sprint if any.',
      inputSchema: { projectId: z.number() },
    },
    run(async ({ projectId }) => {
      const [issues, sprints] = await Promise.all([
        api(`/issues?projectId=${projectId}`),
        api(`/sprints?projectId=${projectId}`),
      ])
      const activeSprint = sprints.find(s => s.status === 'active') || null
      const boardIssues = activeSprint
        ? issues.filter(i => i.sprintId === activeSprint.id)
        : issues.filter(i => i.sprintId == null)
      const columns = {}
      for (const status of ISSUE_STATUSES) {
        columns[status] = boardIssues.filter(i => i.status === status).map(slimIssue)
      }
      return {
        activeSprint: activeSprint
          ? { id: activeSprint.id, name: activeSprint.name, goal: activeSprint.goal, startDate: activeSprint.startDate, endDate: activeSprint.endDate }
          : null,
        note: activeSprint ? undefined : 'No active sprint — showing backlog issues by status.',
        columns,
      }
    })
  )

  server.registerTool(
    'get_backlog',
    {
      description: 'Get backlog issues for a project (issues not assigned to any sprint).',
      inputSchema: { projectId: z.number() },
    },
    run(async ({ projectId }) => {
      const issues = await api(`/sprints/backlog?projectId=${projectId}`)
      return issues.map(slimIssue)
    })
  )

  server.registerTool(
    'list_issues',
    {
      description: 'List issues in a project, optionally filtered by status, type or assignee.',
      inputSchema: {
        projectId: z.number(),
        status: z.enum(ISSUE_STATUSES).optional(),
        type: z.enum(ISSUE_TYPES).optional(),
        assigneeId: z.number().optional(),
      },
    },
    run(async ({ projectId, status, type, assigneeId }) => {
      let issues = await api(`/issues?projectId=${projectId}`)
      if (status) issues = issues.filter(i => i.status === status)
      if (type) issues = issues.filter(i => i.type === type)
      if (assigneeId) issues = issues.filter(i => i.assigneeId === assigneeId)
      return issues.map(slimIssue)
    })
  )

  server.registerTool(
    'get_issue',
    {
      description: 'Get full details of an issue including description, comments and time tracking summary.',
      inputSchema: { issueId: z.number() },
    },
    run(async ({ issueId }) => {
      const [issue, comments, timeSummary] = await Promise.all([
        api(`/issues/${issueId}`),
        api(`/comments/issue/${issueId}`).catch(() => []),
        api(`/time-tracking/issue/${issueId}/summary`).catch(() => null),
      ])
      return {
        ...slimIssue(issue),
        description: issue.description,
        reporter: issue.reporter ? { id: issue.reporter.id, name: issue.reporter.name } : null,
        subtasks: (issue.subtasks || []).map(s => ({ id: s.id, title: s.title, status: s.status })),
        comments: comments.map(c => ({ id: c.id, author: c.author?.name, content: c.content, createdAt: c.createdAt })),
        timeTracking: timeSummary,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      }
    })
  )

  server.registerTool(
    'create_issue',
    {
      description: 'Create an issue (story, task, bug or epic) in a project. Reporter defaults to the token owner. Use plan_sprint to put it in a sprint afterwards.',
      inputSchema: {
        projectId: z.number(),
        title: z.string(),
        type: z.enum(ISSUE_TYPES).default('task'),
        description: z.string().optional().describe('Markdown description'),
        priority: z.enum(ISSUE_PRIORITIES).optional(),
        status: z.enum(ISSUE_STATUSES).optional(),
        assigneeId: z.number().optional(),
        storyPoints: z.union([z.string(), z.number()]).optional(),
        estimate: z.number().optional().describe('Time estimate in hours'),
        labels: z.array(z.string()).optional(),
        epicId: z.number().optional().describe('Parent epic issue id'),
      },
    },
    run(async ({ projectId, title, type, description, priority, status, assigneeId, storyPoints, estimate, labels, epicId }) => {
      const reporter = await me()
      const issue = await api('/issues', {
        method: 'POST',
        body: { projectId, title, type, description, priority, status, assigneeId, storyPoints, estimate, labels, epicId, reporterId: reporter.id },
      })
      return slimIssue(issue)
    })
  )

  server.registerTool(
    'update_issue',
    {
      description: 'Update an issue: move it across the board (status), reassign, edit title/description/priority/points/labels.',
      inputSchema: {
        issueId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(ISSUE_STATUSES).optional(),
        priority: z.enum(ISSUE_PRIORITIES).optional(),
        assigneeId: z.number().nullable().optional(),
        storyPoints: z.union([z.string(), z.number()]).nullable().optional(),
        estimate: z.number().nullable().optional(),
        labels: z.array(z.string()).optional(),
        epicId: z.number().nullable().optional(),
      },
    },
    run(async ({ issueId, ...fields }) => {
      const body = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
      const issue = await api(`/issues/${issueId}`, { method: 'PATCH', body })
      return slimIssue(issue)
    })
  )

  server.registerTool(
    'delete_issue',
    {
      description: 'Permanently delete an issue (and its comments, subtasks, links and time logs cascade). Irreversible — prefer update_issue to close as "done" unless it is genuinely junk/a test. Deleting an epic does NOT delete its children; they keep their epicId.',
      inputSchema: { issueId: z.number() },
    },
    run(async ({ issueId }) => {
      await api(`/issues/${issueId}`, { method: 'DELETE' })
      return { deleted: issueId }
    })
  )

  server.registerTool(
    'add_comment',
    {
      description: 'Add a comment to an issue (authored by the token owner). Use this to log progress notes.',
      inputSchema: { issueId: z.number(), content: z.string() },
    },
    run(({ issueId, content }) => api('/comments', { method: 'POST', body: { issueId, content } }))
  )

  server.registerTool(
    'log_time',
    {
      description: 'Log time spent on an issue.',
      inputSchema: {
        issueId: z.number(),
        hours: z.number().min(0.001).max(24),
        description: z.string().optional(),
        date: z.string().optional().describe('ISO date, defaults to today'),
      },
    },
    run(({ issueId, hours, description, date }) =>
      api('/time-tracking/log', {
        method: 'POST',
        body: { issueId, hours, description, date: date || new Date().toISOString().slice(0, 10) },
      })
    )
  )

  server.registerTool(
    'search_issues',
    {
      description: 'Full-text search issues by title/description, optionally within one project.',
      inputSchema: { query: z.string(), projectId: z.number().optional() },
    },
    run(async ({ query, projectId }) => {
      const { results, totalResults } = await api('/issues/search', { method: 'POST', body: { query, projectId } })
      return { totalResults, results: results.map(slimIssue) }
    })
  )

  // ---------- Subtasks, links & epics ----------

  server.registerTool(
    'add_subtask',
    {
      description: 'Add a subtask (checklist item) to an issue.',
      inputSchema: { issueId: z.number(), title: z.string(), description: z.string().optional() },
    },
    run(({ issueId, title, description }) =>
      api('/subtasks', { method: 'POST', body: { issueId, title, description } })
    )
  )

  server.registerTool(
    'list_subtasks',
    {
      description: 'List an issue\'s subtasks with completion progress.',
      inputSchema: { issueId: z.number() },
    },
    run(async ({ issueId }) => {
      const [subtasks, progress] = await Promise.all([
        api(`/subtasks/issue/${issueId}`),
        api(`/subtasks/issue/${issueId}/progress`).catch(() => null),
      ])
      return {
        progress,
        subtasks: subtasks.map(s => ({ id: s.id, title: s.title, status: s.status, completed: s.completed })),
      }
    })
  )

  server.registerTool(
    'complete_subtask',
    {
      description: 'Mark a subtask done (or reopen it).',
      inputSchema: { subtaskId: z.number(), completed: z.boolean().default(true) },
    },
    run(({ subtaskId, completed }) =>
      api(`/subtasks/${subtaskId}`, {
        method: 'PATCH',
        body: { completed, status: completed ? 'done' : 'todo' },
      })
    )
  )

  server.registerTool(
    'link_issues',
    {
      description: 'Link two issues (e.g. "blocks", "relates_to", "duplicates").',
      inputSchema: {
        sourceIssueId: z.number(),
        targetIssueId: z.number(),
        linkType: z.enum(['blocks', 'blocked_by', 'duplicates', 'duplicated_by', 'relates_to', 'causes', 'caused_by', 'clones', 'cloned_by', 'child_of', 'parent_of']),
      },
    },
    run(({ sourceIssueId, targetIssueId, linkType }) =>
      api('/issue-links', { method: 'POST', body: { sourceIssueId, targetIssueId, linkType } })
    )
  )

  server.registerTool(
    'list_links',
    {
      description: 'List the links of an issue (what it blocks, relates to, duplicates…).',
      inputSchema: { issueId: z.number() },
    },
    run(async ({ issueId }) => {
      const links = await api(`/issue-links/issue/${issueId}`)
      return links.map(l => ({
        id: l.id,
        linkType: l.linkType,
        source: l.sourceIssue ? { id: l.sourceIssue.id, title: l.sourceIssue.title } : { id: l.sourceIssueId },
        target: l.targetIssue ? { id: l.targetIssue.id, title: l.targetIssue.title } : { id: l.targetIssueId },
      }))
    })
  )

  server.registerTool(
    'get_epic',
    {
      description: 'An epic with its child issues and completion progress.',
      inputSchema: { epicId: z.number().describe('Issue id of the epic') },
    },
    run(async ({ epicId }) => {
      const epic = await api(`/issues/${epicId}`)
      if (epic.type !== 'epic') throw new Error(`Issue ${epicId} is a ${epic.type}, not an epic`)
      const all = await api(`/issues?projectId=${epic.projectId}`)
      const children = all.filter(i => i.epicId === epicId)
      const done = children.filter(i => i.status === 'done').length
      return {
        epic: slimIssue(epic),
        description: epic.description,
        progress: { total: children.length, done, percent: children.length ? Math.round((done / children.length) * 100) : 0 },
        children: children.map(slimIssue),
      }
    })
  )

  // ---------- Sprints ----------

  server.registerTool(
    'list_sprints',
    {
      description: 'List sprints for a project with status (future/active/completed) and issue counts.',
      inputSchema: { projectId: z.number() },
    },
    run(async ({ projectId }) => {
      const sprints = await api(`/sprints?projectId=${projectId}`)
      return sprints.map(s => ({
        id: s.id, name: s.name, goal: s.goal, status: s.status,
        startDate: s.startDate, endDate: s.endDate,
        issueCount: s.issues?.length ?? undefined,
      }))
    })
  )

  server.registerTool(
    'create_sprint',
    {
      description: 'Create a new (future) sprint. Use plan_sprint to fill it and start_sprint to begin it.',
      inputSchema: { projectId: z.number(), name: z.string(), goal: z.string().optional() },
    },
    run(async ({ projectId, name, goal }) => {
      const creator = await me()
      return api('/sprints', { method: 'POST', body: { projectId, name, goal, createdById: creator.id } })
    })
  )

  server.registerTool(
    'plan_sprint',
    {
      description: 'Move issues from the backlog into a sprint (Jira-style sprint planning).',
      inputSchema: { sprintId: z.number(), issueIds: z.array(z.number()).min(1) },
    },
    run(async ({ sprintId, issueIds }) => {
      const results = []
      for (const issueId of issueIds) {
        await api(`/sprints/${sprintId}/add-issue/${issueId}`, { method: 'POST', body: {} })
        results.push(issueId)
      }
      return { sprintId, added: results }
    })
  )

  server.registerTool(
    'remove_from_sprint',
    {
      description: 'Move an issue out of a sprint back to the backlog.',
      inputSchema: { sprintId: z.number(), issueId: z.number() },
    },
    run(({ sprintId, issueId }) => api(`/sprints/${sprintId}/remove-issue/${issueId}`, { method: 'POST', body: {} }))
  )

  server.registerTool(
    'start_sprint',
    {
      description: 'Start a sprint. Defaults to a 2-week sprint starting today if dates are omitted.',
      inputSchema: {
        sprintId: z.number(),
        startDate: z.string().optional().describe('ISO date'),
        endDate: z.string().optional().describe('ISO date'),
      },
    },
    run(({ sprintId, startDate, endDate }) => {
      const start = startDate ? new Date(startDate) : new Date()
      const end = endDate ? new Date(endDate) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000)
      return api(`/sprints/${sprintId}/start`, { method: 'POST', body: { startDate: start.toISOString(), endDate: end.toISOString() } })
    })
  )

  server.registerTool(
    'complete_sprint',
    {
      description: 'Complete a sprint. Unfinished issues return to the backlog.',
      inputSchema: { sprintId: z.number() },
    },
    run(({ sprintId }) => api(`/sprints/${sprintId}/complete`, { method: 'POST', body: {} }))
  )

  // ---------- Reports ----------

  server.registerTool(
    'sprint_report',
    {
      description: 'Sprint burndown and health metrics for a sprint.',
      inputSchema: { sprintId: z.number() },
    },
    run(async ({ sprintId }) => {
      const [burndown, health] = await Promise.all([
        api(`/analytics/burndown/${sprintId}`).catch(e => ({ error: e.message })),
        api(`/analytics/sprint-health/${sprintId}`).catch(e => ({ error: e.message })),
      ])
      return { burndown, health }
    })
  )

  server.registerTool(
    'project_dashboard',
    {
      description: 'Project analytics dashboard: velocity, throughput, cycle time overview.',
      inputSchema: { projectId: z.number() },
    },
    run(({ projectId }) => api(`/analytics/dashboard/${projectId}`))
  )

  return server
}

/** Fresh McpServer with all tools registered against a bound `api`. */
export function buildServer(api) {
  const server = new McpServer({ name: 'ossicone', version: '0.5.0' })
  registerTools(server, api)
  return server
}
