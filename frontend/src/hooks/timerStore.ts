/**
 * One shared view of the signed-in person's timers, owned by the server.
 *
 * Timers used to live in each browser. Now the server keeps them, so the board, the API and MCP agents all drive the
 * same clock. This store only mirrors that: it fetches, keeps the reading, and lets components tick the display
 * between fetches (elapsed = the server's reading + time since we read it).
 */
import { useSyncExternalStore } from 'react'
import { TimersService } from '../services/api/timers.service'
import type { Timer } from '../services/api/timers.service'
import { getToken } from '../lib/auth'

interface Snapshot {
  timers: Timer[]
  /** When the server's readings were taken, to add the time since then to running timers. */
  readAt: number
  loaded: boolean
}

let snapshot: Snapshot = { timers: [], readAt: Date.now(), loaded: false }
const listeners = new Set<() => void>()
let started = false
let inFlight: Promise<void> | null = null

const emit = () => listeners.forEach(l => l())
const set = (next: Snapshot) => { snapshot = next; emit() }

const LEGACY_KEY = 'ossicone-active-timers'

/** Timers that were running in this browser before timers moved to the server are adopted once, then forgotten. */
const importLegacy = async () => {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const entries = JSON.parse(raw) as Array<[number, { status?: string; totalElapsed?: number }]>
    const items = entries
      .filter(([, t]) => (t.status === 'running' || t.status === 'paused') && (t.totalElapsed ?? 0) > 0)
      .map(([issueId, t]) => ({ issueId, elapsedMs: t.totalElapsed as number, status: t.status as 'running' | 'paused' }))
    if (items.length) await TimersService.importLocal(items)
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* an unreadable old value is not worth blocking timers for */ }
}

export const refreshTimers = (): Promise<void> => {
  if (!getToken()) return Promise.resolve()
  if (inFlight) return inFlight
  inFlight = TimersService.list()
    .then(timers => set({ timers, readAt: Date.now(), loaded: true }))
    .catch(() => set({ ...snapshot, loaded: true }))
    .finally(() => { inFlight = null })
  return inFlight
}

/** After something may have changed the server's timers (a status change, an agent), look again, twice. */
export const refreshTimersSoon = () => {
  window.setTimeout(() => { void refreshTimers() }, 500)
  window.setTimeout(() => { void refreshTimers() }, 2500)
}

const start = () => {
  if (started) return
  started = true
  void importLegacy().then(refreshTimers)
  window.addEventListener('ossicone-refresh', (e: Event) => {
    if ((e as CustomEvent).detail?.type === 'timers') void refreshTimers()
  })
  window.addEventListener('focus', () => { void refreshTimers() })
  window.setInterval(() => { if (document.visibilityState === 'visible') void refreshTimers() }, 30_000)
}

const subscribe = (listener: () => void) => {
  start()
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const useTimerSnapshot = (): Snapshot => useSyncExternalStore(subscribe, () => snapshot)

/** What one timer reads right now: the server's reading plus the time since it was taken, if running. */
export const liveElapsed = (timer: Timer, readAt: number, now: number): number =>
  timer.elapsedMs + (timer.status === 'running' ? Math.max(0, now - readAt) : 0)

/** For tests: put the store back to empty. */
export const resetTimerStore = () => { snapshot = { timers: [], readAt: Date.now(), loaded: false } }

// Actions: do it on the server, then take the server's word for the new state.
const act = async (fn: () => Promise<Timer>) => {
  const result = await fn()
  await refreshTimers()
  return result
}
export const startTimer = (issueId: number) => act(() => TimersService.start(issueId))
export const pauseTimer = (issueId: number) => act(() => TimersService.pause(issueId))
export const resumeTimer = (issueId: number) => act(() => TimersService.resume(issueId))
export const stopTimer = (issueId: number, options: { log?: boolean; description?: string } = {}) => act(() => TimersService.stop(issueId, options))
