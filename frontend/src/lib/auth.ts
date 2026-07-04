const TOKEN_KEY = 'ossicone-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Wraps window.fetch so every request to /api/* carries the session token
 * and a 401 response clears the session and returns to the login page.
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
    if (isApi && token) {
      if (input instanceof Request && !init) {
        const headers = new Headers(input.headers)
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
        input = new Request(input, { headers })
      } else {
        const headers = new Headers(init?.headers)
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
        init = { ...init, headers }
      }
    }

    const response = await originalFetch(input, init)

    if (
      isApi &&
      response.status === 401 &&
      !url.includes('/api/auth/login') &&
      window.location.pathname !== '/login'
    ) {
      clearToken()
      window.location.href = '/login'
    }

    return response
  }
}
