// Lightweight Skylark error reporter (no dependency). Posts to the Skylark
// project's public ingest-token endpoint. Configured via Vite build env:
//   VITE_SKYLARK_URL   e.g. https://skylark.halfagiraf.com
//   VITE_SKYLARK_TOKEN the Ossicone project's ingest_token
// No-ops when unset, so local/dev builds don't report.

const SKYLARK_URL = import.meta.env.VITE_SKYLARK_URL as string | undefined
const SKYLARK_TOKEN = import.meta.env.VITE_SKYLARK_TOKEN as string | undefined
const ENVIRONMENT = import.meta.env.MODE === 'production' ? 'production' : 'development'
const RELEASE = (import.meta.env.VITE_RELEASE as string | undefined) || undefined

const enabled = (): boolean => Boolean(SKYLARK_URL && SKYLARK_TOKEN)

function send(payload: Record<string, unknown>): void {
  if (!enabled()) return
  try {
    fetch(`${SKYLARK_URL}/api/events/ingest/token/${SKYLARK_TOKEN}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment: ENVIRONMENT, release: RELEASE, tags: ['frontend'], ...payload }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* never let reporting throw */
  }
}

export function captureException(error: unknown, extra?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error))
  send({ message: err.message || 'Unknown error', level: 'error', stack: err.stack, extra })
}

export function captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info'): void {
  send({ message, level })
}

/** Report a failed API request (5xx or network failure) with request context. */
export function captureApiError(url: string, status: number, method = 'GET'): void {
  send({
    message: status
      ? `API ${status} ${method} ${url}`
      : `API network error ${method} ${url}`,
    level: 'error',
    tags: ['frontend', 'api'],
    extra: { url, status, method },
  })
}

let installed = false
export function initSkylark(): void {
  if (installed || !enabled()) return
  installed = true
  window.addEventListener('error', event => {
    captureException(event.error ?? new Error(event.message), { source: event.filename, line: event.lineno })
  })
  window.addEventListener('unhandledrejection', event => {
    captureException(event.reason ?? new Error('Unhandled promise rejection'))
  })
}
