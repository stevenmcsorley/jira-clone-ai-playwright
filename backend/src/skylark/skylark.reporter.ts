/**
 * Fire-and-forget reporter that posts an error to the Skylark ingest endpoint.
 * No-op unless SKYLARK_URL + SKYLARK_TOKEN are set. Never throws.
 */
export function reportToSkylark(
  error: unknown,
  opts?: { tags?: string[]; extra?: Record<string, unknown> },
): void {
  const url = process.env.SKYLARK_URL
  const token = process.env.SKYLARK_TOKEN
  if (!url || !token) return

  const err = error instanceof Error ? error : new Error(String(error))
  try {
    void fetch(`${url}/api/events/ingest/token/${token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: err.message || 'Unhandled server error',
        level: 'error',
        environment: process.env.NODE_ENV || 'production',
        stack: err.stack,
        tags: opts?.tags ?? ['backend'],
        extra: opts?.extra,
      }),
    }).catch(() => {})
  } catch {
    /* never let reporting break anything */
  }
}
