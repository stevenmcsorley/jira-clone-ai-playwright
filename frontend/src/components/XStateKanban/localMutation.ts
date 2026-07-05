/**
 * Module-level marker for locally-initiated issue mutations (e.g. a drag-drop
 * on the board). The websocket echoes every mutation back as 'issue:updated',
 * which normally triggers a full board refetch + remount — for the author's
 * own change that refetch is redundant (the machine already holds the
 * confirmed state) and causes a visible flicker/scroll reset. Consumers can
 * check `isRecentLocalMutation()` to skip the disruptive refresh for echoes
 * of their own writes while still honouring other users' changes.
 */

const DEFAULT_ECHO_WINDOW_MS = 2000

let lastLocalMutationAt = 0

/** Record that this client just performed an issue mutation. */
export const markLocalMutation = (): void => {
  lastLocalMutationAt = Date.now()
}

/** True when a local mutation happened within the last `windowMs` (default 2s). */
export const isRecentLocalMutation = (windowMs: number = DEFAULT_ECHO_WINDOW_MS): boolean =>
  Date.now() - lastLocalMutationAt < windowMs
