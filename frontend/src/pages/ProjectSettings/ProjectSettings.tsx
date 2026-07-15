import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import { useAuth } from '../../contexts/AuthContext'
import { ProjectsService } from '../../services/api/projects.service'
import { GitService, isRepoConnected } from '../../services/api/git.service'
import { WebhooksService, WEBHOOK_EVENT_LABELS, type ProjectWebhook } from '../../services/api/webhooks.service'
import type { Project, RepoConfig } from '../../types/domain.types'

export const ProjectSettings = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useProjects()
  const { users } = useUsers()
  const { currentWorkspace } = useAuth()
  const canManageRepo =
    currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'admin'

  const [project, setProject] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [leadId, setLeadId] = useState<number>(1)

  // Repository (git integration) state
  const [repo, setRepo] = useState<RepoConfig | null>(null)
  const [repoProvider, setRepoProvider] = useState('github')
  const [repoOwner, setRepoOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [repoBranch, setRepoBranch] = useState('')
  const [repoToken, setRepoToken] = useState('')
  const [repoSaving, setRepoSaving] = useState(false)
  const [repoError, setRepoError] = useState<string | null>(null)
  const [repoMessage, setRepoMessage] = useState<string | null>(null)

  useEffect(() => {
    const currentProject = projects.find(p => p.id === Number(projectId))
    if (currentProject) {
      setProject(currentProject)
      setName(currentProject.name)
      setKey(currentProject.key)
      setDescription(currentProject.description || '')
      setLeadId(currentProject.leadId)
    }
  }, [projects, projectId])

  useEffect(() => {
    if (!projectId) return
    GitService.getConfig(Number(projectId))
      .then(result => {
        if (isRepoConnected(result)) {
          setRepo(result)
          setRepoProvider(result.provider)
          setRepoOwner(result.owner)
          setRepoName(result.repo)
          setRepoBranch(result.defaultBranch || '')
        } else {
          setRepo(null)
        }
      })
      .catch(() => setRepo(null))
  }, [projectId])

  const handleRepoSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    try {
      setRepoSaving(true)
      setRepoError(null)
      setRepoMessage(null)
      const updated = await GitService.setConfig(project.id, {
        provider: repoProvider,
        owner: repoOwner.trim(),
        repo: repoName.trim(),
        // Omit token entirely when left blank on an already-connected repo so
        // the server keeps the stored one; send it (even empty) otherwise.
        ...(repoToken !== '' || !repo ? { token: repoToken } : {}),
        defaultBranch: repoBranch.trim() || undefined,
      })
      setRepo(updated)
      setRepoToken('')
      setRepoMessage('Repository connection saved.')
    } catch (err) {
      setRepoError(err instanceof Error ? err.message : 'Failed to save repository')
    } finally {
      setRepoSaving(false)
    }
  }

  const handleRepoDisconnect = async () => {
    if (!project) return
    if (!window.confirm('Disconnect this repository from the project?')) return
    try {
      setRepoSaving(true)
      setRepoError(null)
      setRepoMessage(null)
      await GitService.deleteConfig(project.id)
      setRepo(null)
      setRepoOwner('')
      setRepoName('')
      setRepoBranch('')
      setRepoToken('')
      setRepoMessage('Repository disconnected.')
    } catch (err) {
      setRepoError(err instanceof Error ? err.message : 'Failed to disconnect repository')
    } finally {
      setRepoSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    const updates = {
      name: name.trim(),
      key: key.trim().toUpperCase(),
      description: description.trim() || undefined,
      leadId,
    }

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      await ProjectsService.update(project.id, updates)
      setSuccessMessage('Project settings updated successfully!')

      // Optionally redirect after a delay
      setTimeout(() => {
        navigate(`/projects/${projectId}`)
      }, 1500)
    } catch (err) {
      console.error('Error updating project:', err)
      setError('Failed to update project settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone and will delete all issues in this project.`
    )

    if (!confirmed) return

    try {
      setSaving(true)
      await ProjectsService.delete(project.id)
      navigate('/')
    } catch (err) {
      console.error('Error deleting project:', err)
      setError('Failed to delete project')
      setSaving(false)
    }
  }

  if (projectsLoading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${projectId}`}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Board
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              Project Settings
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/projects/${projectId}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="project-settings-form"
              disabled={saving || !name.trim() || !key.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        <form id="project-settings-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Project Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Details</h2>

            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name..."
                  required
                />
              </div>

              {/* Project Key */}
              <div>
                <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Key *
                </label>
                <input
                  type="text"
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., TIS"
                  maxLength={10}
                  pattern="[A-Z]+"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in issue IDs (e.g., {key || 'KEY'}-123). Only uppercase letters allowed.
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project description..."
                />
              </div>

              {/* Project Lead */}
              <div>
                <label htmlFor="lead" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Lead
                </label>
                <select
                  id="lead"
                  value={leadId}
                  onChange={(e) => setLeadId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Project Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Information</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Project ID:</span>
                <span className="text-gray-600">{project.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Created:</span>
                <span className="text-gray-600">{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="text-gray-600">{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Current Lead:</span>
                <span className="text-gray-600">
                  {project.lead ? `${project.lead.name} (${project.lead.email})` : 'Not assigned'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Repository */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Repository</h2>
            {repo ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Connected{repo.hasToken ? ' (token set)' : ' (public read)'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                Not connected
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Link a Git repository to view commits, branches and pull requests on the{' '}
            <Link
              to={`/projects/${projectId}/repository`}
              className="text-blue-600 hover:underline"
            >
              Repository page
            </Link>
            .
          </p>

          {repoError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-600">{repoError}</p>
            </div>
          )}
          {repoMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <p className="text-sm text-green-600">{repoMessage}</p>
            </div>
          )}

          {!canManageRepo && (
            <p className="text-sm text-gray-500 italic mb-4">
              Only workspace owners and admins can change the repository connection.
            </p>
          )}

          <form onSubmit={handleRepoSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider
                </label>
                <select
                  value={repoProvider}
                  onChange={e => setRepoProvider(e.target.value)}
                  disabled={!canManageRepo}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value="github">GitHub</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default branch
                </label>
                <input
                  type="text"
                  value={repoBranch}
                  onChange={e => setRepoBranch(e.target.value)}
                  disabled={!canManageRepo}
                  placeholder="main"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner *
                </label>
                <input
                  type="text"
                  value={repoOwner}
                  onChange={e => setRepoOwner(e.target.value)}
                  disabled={!canManageRepo}
                  placeholder="e.g. stevenmcsorley"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository *
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={e => setRepoName(e.target.value)}
                  disabled={!canManageRepo}
                  placeholder="e.g. jira-clone-ai-playwright"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal Access Token
              </label>
              <input
                type="password"
                value={repoToken}
                onChange={e => setRepoToken(e.target.value)}
                disabled={!canManageRepo}
                placeholder={
                  repo?.hasToken
                    ? 'connected — leave blank to keep'
                    : 'optional for public repos'
                }
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Stored securely server-side and never returned by the API. Public repos
                can be read without a token (subject to rate limits).
              </p>
            </div>

            {canManageRepo && (
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={repoSaving || !repoOwner.trim() || !repoName.trim()}
                >
                  {repoSaving ? 'Saving...' : repo ? 'Update Connection' : 'Connect Repository'}
                </Button>
                {repo && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRepoDisconnect}
                    disabled={repoSaving}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Chat integrations (outbound webhooks) */}
        <WebhooksCard projectId={Number(projectId)} canManage={canManageRepo} />

        {/* Danger Zone */}
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h2 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Delete Project</h3>
              <p className="text-sm text-gray-600">
                Once you delete a project, there is no going back. All issues and data will be permanently deleted.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              Delete Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Per-project outbound webhooks: post issue/sprint activity to a chat channel (Slack, Relay, …)
 *  with deep links back to the exact ticket/sprint/report. Owner/admin manages; anyone can view. */
function WebhooksCard({ projectId, canManage }: { projectId: number; canManage: boolean }) {
  const [hooks, setHooks] = useState<ProjectWebhook[]>([])
  const [allEvents, setAllEvents] = useState<string[]>([])
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [selEvents, setSelEvents] = useState<string[]>([
    'issue.created', 'issue.done', 'sprint.started', 'sprint.completed',
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = () => WebhooksService.list(projectId).then(setHooks).catch(() => {})
  useEffect(() => {
    load()
    WebhooksService.events(projectId)
      .then(setAllEvents)
      .catch(() => setAllEvents(Object.keys(WEBHOOK_EVENT_LABELS)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const toggleEvent = (e: string) =>
    setSelEvents(s => (s.includes(e) ? s.filter(x => x !== e) : [...s, e]))

  const add = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError(null); setMsg(null)
    if (!url.trim()) { setError('Enter a webhook URL'); return }
    try {
      setSaving(true)
      await WebhooksService.create(projectId, {
        label: label.trim() || 'Chat webhook',
        url: url.trim(),
        events: selEvents,
        secret: secret.trim() || null,
      })
      setLabel(''); setUrl(''); setSecret('')
      setMsg('Webhook added.')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to add webhook')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (h: ProjectWebhook) => {
    await WebhooksService.update(projectId, h.id, { active: !h.active }).catch(() => {})
    load()
  }
  const removeHook = async (h: ProjectWebhook) => {
    if (!window.confirm('Delete this webhook?')) return
    await WebhooksService.remove(projectId, h.id).catch(() => {})
    load()
  }
  const test = async (h: ProjectWebhook) => {
    setMsg(null); setError(null)
    try {
      const r = await WebhooksService.test(projectId, h.id)
      if (r.ok) setMsg(`Test delivered (HTTP ${r.status}).`)
      else setError(`Test failed (HTTP ${r.status || 'no response'}). Check the URL.`)
    } catch (e: any) {
      setError(e?.message || 'Test failed')
    }
  }

  const events = allEvents.length ? allEvents : Object.keys(WEBHOOK_EVENT_LABELS)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Chat integrations</h2>
        <span className="text-sm text-gray-500">
          {hooks.length} webhook{hooks.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Post issue &amp; sprint activity to a chat channel (Slack, Relay, …). In your chat app add an{' '}
        <strong>Ossicone incoming webhook</strong> and paste its URL here — each update arrives with a
        direct link back to the ticket, sprint or report.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {msg && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          <p className="text-sm text-green-600">{msg}</p>
        </div>
      )}

      {hooks.length > 0 && (
        <ul className="divide-y divide-gray-100 mb-5 border border-gray-100 rounded-md">
          {hooks.map(h => (
            <li key={h.id} className="p-3 flex items-start gap-3">
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${h.active ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{h.label}</div>
                <div className="text-xs text-gray-500 truncate">{h.url}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {h.events?.length ? h.events.map(e => WEBHOOK_EVENT_LABELS[e] || e).join(' · ') : 'All events'}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => test(h)} className="text-xs text-blue-600 hover:underline">Test</button>
                  <button onClick={() => toggleActive(h)} className="text-xs text-gray-600 hover:underline">
                    {h.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => removeHook(h)} className="text-xs text-red-600 hover:underline">Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!canManage ? (
        <p className="text-sm text-gray-500 italic">
          Only workspace owners and admins can manage webhooks.
        </p>
      ) : (
        <form onSubmit={add} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. #dev in Relay"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL *</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://relay.…/api/integrations/in/…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {events.map(e => (
                <label key={e} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={selEvents.includes(e)} onChange={() => toggleEvent(e)} />
                  {WEBHOOK_EVENT_LABELS[e] || e}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave all unchecked to receive every event.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Signing secret (optional)</label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              autoComplete="new-password"
              placeholder="optional — sent as X-Ossicone-Signature"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" disabled={saving || !url.trim()}>
            {saving ? 'Adding…' : 'Add webhook'}
          </Button>
        </form>
      )}
    </div>
  )
}