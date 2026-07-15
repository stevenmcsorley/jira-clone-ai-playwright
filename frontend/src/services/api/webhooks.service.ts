const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export interface ProjectWebhook {
  id: number
  projectId: number
  label: string
  url: string
  events: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface WebhookInput {
  label?: string
  url?: string
  events?: string[]
  active?: boolean
  secret?: string | null
}

/**
 * Talks to /api/projects/:id/webhooks. Raw fetch (the global auth wrapper injects
 * token + workspace headers) so backend error messages surface cleanly in the UI.
 */
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message
    throw new Error(message || `Request failed (${response.status})`)
  }
  const text = await response.text()
  return (text ? JSON.parse(text) : {}) as T
}

export class WebhooksService {
  static list(projectId: number): Promise<ProjectWebhook[]> {
    return call(`/projects/${projectId}/webhooks?_cb=${Date.now()}`)
  }

  static events(projectId: number): Promise<string[]> {
    return call(`/projects/${projectId}/webhooks/events`)
  }

  static create(projectId: number, data: WebhookInput): Promise<ProjectWebhook> {
    return call(`/projects/${projectId}/webhooks`, { method: 'POST', body: JSON.stringify(data) })
  }

  static update(projectId: number, id: number, data: WebhookInput): Promise<ProjectWebhook> {
    return call(`/projects/${projectId}/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  static remove(projectId: number, id: number): Promise<void> {
    return call(`/projects/${projectId}/webhooks/${id}`, { method: 'DELETE' })
  }

  static test(projectId: number, id: number): Promise<{ ok: boolean; status: number }> {
    return call(`/projects/${projectId}/webhooks/${id}/test`, { method: 'POST' })
  }
}

export const WEBHOOK_EVENT_LABELS: Record<string, string> = {
  'issue.created': 'Issue created',
  'issue.updated': 'Issue edited',
  'issue.moved': 'Issue status changed',
  'issue.done': 'Issue completed',
  'sprint.started': 'Sprint started',
  'sprint.completed': 'Sprint completed',
}
