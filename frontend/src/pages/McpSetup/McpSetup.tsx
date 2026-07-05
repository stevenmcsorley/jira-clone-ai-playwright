import { useEffect, useState } from 'react'

interface TokenInfo {
  id: number
  name: string
  description?: string
  isActive: boolean
  lastUsedAt?: string
  createdAt: string
}

const TOOL_GROUPS: { title: string; tools: [string, string][] }[] = [
  {
    title: 'Projects & people',
    tools: [
      ['list_projects', 'List all projects'],
      ['create_project', 'Create a project (name, key, description)'],
      ['list_users', 'List users for assigning work'],
    ],
  },
  {
    title: 'Board & issues',
    tools: [
      ['get_board', 'Board view: issues grouped by status, active sprint'],
      ['get_backlog', 'Backlog (issues not in any sprint)'],
      ['list_issues', 'List/filter issues by status, type, assignee'],
      ['search_issues', 'Full-text search across issues'],
      ['get_issue', 'Full issue detail with comments and time tracking'],
      ['create_issue', 'Create stories, tasks, bugs and epics'],
      ['update_issue', 'Move across the board, reassign, edit fields'],
      ['add_comment', 'Comment on an issue (progress notes)'],
      ['log_time', 'Log hours against an issue'],
    ],
  },
  {
    title: 'Subtasks, links & epics',
    tools: [
      ['add_subtask', 'Add a checklist item to an issue'],
      ['list_subtasks', 'Subtasks with completion progress'],
      ['complete_subtask', 'Tick a subtask off'],
      ['link_issues', 'Link issues (blocks, relates to, duplicates…)'],
      ['list_links', 'An issue\'s links'],
      ['get_epic', 'Epic with children and % complete'],
    ],
  },
  {
    title: 'Workspace',
    tools: [
      ['get_workspace', 'Current workspace, your role, members'],
      ['list_workspaces', 'All workspaces you belong to'],
    ],
  },
  {
    title: 'Sprints',
    tools: [
      ['list_sprints', 'Sprints with status and dates'],
      ['create_sprint', 'Create a future sprint with a goal'],
      ['plan_sprint', 'Pull backlog issues into a sprint'],
      ['remove_from_sprint', 'Send an issue back to the backlog'],
      ['start_sprint', 'Start a sprint (defaults to 2 weeks)'],
      ['complete_sprint', 'Complete a sprint; unfinished work returns to backlog'],
    ],
  },
  {
    title: 'Reports',
    tools: [
      ['sprint_report', 'Burndown + sprint health'],
      ['project_dashboard', 'Velocity, throughput and cycle-time overview'],
    ],
  },
]

const EXAMPLE_PROMPTS = [
  'Set up a project called "Website Redesign" in Ossicone and break it into epics and stories.',
  'Plan a 2-week sprint from the top of the Ossicone backlog and start it.',
  'What’s on the board right now? Move anything I’ve finished to done.',
  'Log 2 hours against the auth issue and comment on what changed.',
  'How is the current sprint going? Give me the burndown.',
]

export const McpSetup = () => {
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [tokenName, setTokenName] = useState('claude')
  const [tokenAccess, setTokenAccess] = useState<'full' | 'readonly'>('full')
  const [newToken, setNewToken] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const origin = window.location.origin
  const registerCommand = `claude mcp add ossicone \\
  --env OSSICONE_URL=${origin} \\
  --env OSSICONE_API_TOKEN=<your token> \\
  -- node <path-to-repo>/mcp/index.js`

  const loadTokens = () => {
    fetch('/api/tokens')
      .then(res => (res.ok ? res.json() : []))
      .then(setTokens)
      .catch(() => setTokens([]))
  }

  useEffect(loadTokens, [])

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCreateToken = async () => {
    setCreating(true)
    setError(null)
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tokenName.trim() || 'claude',
          description: 'MCP access token',
          scopes: tokenAccess === 'readonly' ? ['read'] : ['read', 'write'],
        }),
      })
      if (!response.ok) throw new Error('Failed to create token')
      const data = await response.json()
      setNewToken(data.token)
      loadTokens()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: number) => {
    if (!window.confirm('Revoke this token? Any agent using it loses access immediately.')) return
    await fetch(`/api/tokens/${id}/revoke`, { method: 'POST' })
    loadTokens()
  }

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Agent access (MCP)</h1>
        <p className="text-gray-600 mt-2 max-w-2xl">
          Ossicone ships an <span className="font-medium">MCP server</span> — a bridge that lets an AI
          agent like Claude work this tracker the way you do: create projects and issues, plan and run
          sprints, move cards across the board, comment, log time and read reports. Everything the agent
          does is done as <span className="font-medium">you</span>, using a personal API token.
        </p>
      </div>

      {/* Step 1: token */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">1. Create an API token</h2>
        <p className="text-sm text-gray-600 mb-4">
          The token identifies the agent as you. It is shown <span className="font-medium">once</span> —
          copy it straight into the setup command below.
        </p>

        <div className="flex gap-3 items-center">
          <input
            value={tokenName}
            onChange={e => setTokenName(e.target.value)}
            placeholder="Token name"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
          <select
            value={tokenAccess}
            onChange={e => setTokenAccess(e.target.value as 'full' | 'readonly')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="full">Full access (read + write)</option>
            <option value="readonly">Read-only (observe, never change)</option>
          </select>
          <button
            onClick={handleCreateToken}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md px-4 py-2 text-sm"
          >
            {creating ? 'Creating…' : 'Generate token'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        {newToken && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-4">
            <p className="text-sm font-medium text-amber-800 mb-2">
              Your new token — copy it now, it won’t be shown again:
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-white border border-amber-200 rounded px-3 py-2 text-xs break-all flex-1">
                {newToken}
              </code>
              <button
                onClick={() => copy(newToken, 'token')}
                className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                {copied === 'token' ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {tokens.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your tokens</h3>
            <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {tokens.map(t => (
                  <tr key={t.id}>
                    <td className="py-2 pr-4 font-medium text-gray-900">{t.name}</td>
                    <td className="py-2 pr-4 text-gray-500">
                      {t.isActive ? (
                        t.lastUsedAt
                          ? `last used ${new Date(t.lastUsedAt).toLocaleDateString()}`
                          : 'never used'
                      ) : (
                        <span className="text-red-500">revoked</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {t.isActive && (
                        <button
                          onClick={() => handleRevoke(t.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </section>

      {/* Step 2: register */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">2. Register with Claude Code</h2>
        <p className="text-sm text-gray-600 mb-4">
          The MCP server lives in the <code className="bg-gray-100 px-1 rounded">mcp/</code> folder of the
          Ossicone repo (run <code className="bg-gray-100 px-1 rounded">npm install</code> there once). Then:
        </p>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 rounded-md p-4 text-xs overflow-x-auto">{registerCommand}</pre>
          <button
            onClick={() => copy(registerCommand.replace(/\\\n\s*/g, ' '), 'cmd')}
            className="absolute top-2 right-2 text-xs text-gray-300 hover:text-white bg-gray-700 rounded px-2 py-1"
          >
            {copied === 'cmd' ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Tools appear when the next Claude session starts. Other MCP clients work too — anything that can
          launch a stdio MCP server with those two environment variables.
        </p>
      </section>

      {/* What it can do */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What the agent can do</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOL_GROUPS.map(group => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{group.title}</h3>
              <ul className="space-y-1">
                {group.tools.map(([name, desc]) => (
                  <li key={name} className="text-sm">
                    <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs">{name}</code>
                    <span className="text-gray-500 ml-2">{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Example prompts */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Things to try</h2>
        <ul className="space-y-2">
          {EXAMPLE_PROMPTS.map(prompt => (
            <li key={prompt} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
              “{prompt}”
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500 mt-4">
          Everything the agent creates shows up here instantly (the board updates in real time), attributed
          to your user — comments, time logs and all. Revoke the token above to cut off access at any time.
        </p>
      </section>
    </div>
  )
}
