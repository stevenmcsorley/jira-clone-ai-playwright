import { captureApiError } from './skylark'

const TOKEN_KEY = 'ossicone-token'
const WORKSPACE_KEY = 'ossicone-workspace'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  clearWorkspaceId()
}

export function getWorkspaceId(): string | null {
  return localStorage.getItem(WORKSPACE_KEY)
}

export function setWorkspaceId(id: number | string): void {
  localStorage.setItem(WORKSPACE_KEY, String(id))
  // Let the websocket singleton (re)join the right workspace room
  window.dispatchEvent(new CustomEvent('ossicone-workspace-changed'))
}

export function clearWorkspaceId(): void {
  localStorage.removeItem(WORKSPACE_KEY)
}

/**
 * Wraps window.fetch so every request to /api/* carries the session token
 * (and the active workspace id) and a 401 response clears the session and
 * returns to the login page.
 * Installed once at startup (main.tsx) — covers all service layers
 * (BaseApiService, effect services, raw fetch calls in machines/hooks).
 */
export function installAuthFetch(): void {
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const isApi =
      url.startsWith('/api') || url.startsWith(`${window.location.origin}/api`)

    const token = getToken()
    const workspaceId = getWorkspaceId()
    if (isApi && (token || workspaceId)) {
      const applyHeaders = (headers: Headers) => {
        if (token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`)
        }
        if (workspaceId && !headers.has('X-Workspace-Id')) {
          headers.set('X-Workspace-Id', workspaceId)
        }
      }
      if (input instanceof Request && !init) {
        const headers = new Headers(input.headers)
        applyHeaders(headers)
        input = new Request(input, { headers })
      } else {
        const headers = new Headers(init?.headers)
        applyHeaders(headers)
        init = { ...init, headers }
      }
    }

    const method = (
      init?.method || (input instanceof Request ? input.method : 'GET') || 'GET'
    ).toUpperCase()

    let response: Response
    try {
      response = await originalFetch(input, init)
    } catch (err) {
      // Network failure reaching the API — report and rethrow.
      if (isApi) captureApiError(url, 0, method)
      throw err
    }

    if (
      isApi &&
      response.status === 401 &&
      !url.includes('/api/auth/login') &&
      window.location.pathname !== '/login'
    ) {
      clearToken()
      window.location.href = '/login'
    }

    // Surface server-side (5xx) API failures to Skylark from the client's view.
    if (isApi && response.status >= 500) {
      captureApiError(url, response.status, method)
    }

    return response
  }
}
