import type {
  RepoBranch,
  RepoCommit,
  RepoConfig,
  RepoPullRequest,
  SetRepoRequest,
} from '../../types/domain.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/** GET config returns this when no repo is linked. */
export interface RepoConfigResponse {
  connected?: false
}

/**
 * Talks to /api/projects/:id/repo. Uses raw fetch (the global auth wrapper
 * injects the token + workspace headers) so backend error messages surface
 * cleanly in the UI instead of a generic status string.
 */
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message
    throw new Error(message || `Request failed (${response.status})`)
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : {}) as T
}

export class GitService {
  static async getConfig(projectId: number): Promise<RepoConfig | RepoConfigResponse> {
    return call(`/projects/${projectId}/repo?_cb=${Date.now()}`)
  }

  static async setConfig(projectId: number, data: SetRepoRequest): Promise<RepoConfig> {
    return call(`/projects/${projectId}/repo`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  static async deleteConfig(projectId: number): Promise<void> {
    await call(`/projects/${projectId}/repo`, { method: 'DELETE' })
  }

  static async getCommits(
    projectId: number,
    branch?: string,
    limit = 20,
  ): Promise<RepoCommit[]> {
    const params = new URLSearchParams({ limit: String(limit) })
    if (branch) params.set('branch', branch)
    return call(`/projects/${projectId}/repo/commits?${params.toString()}`)
  }

  static async getBranches(projectId: number): Promise<RepoBranch[]> {
    return call(`/projects/${projectId}/repo/branches`)
  }

  static async getPulls(projectId: number): Promise<RepoPullRequest[]> {
    return call(`/projects/${projectId}/repo/pulls`)
  }
}

export function isRepoConnected(
  config: RepoConfig | RepoConfigResponse,
): config is RepoConfig {
  return (config as RepoConfig).owner !== undefined
}
