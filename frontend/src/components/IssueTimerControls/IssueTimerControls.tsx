import { useState } from 'react'
import { Pause, Play, Square } from 'lucide-react'
import { useTimerManager } from '../../hooks/useTimerManager'
import { formatClock } from '../../utils/timerProgress'

const button = 'inline-flex min-h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50'

/** Start, pause, resume and stop the timer on one issue. The same timer an agent drives over MCP. */
export const IssueTimerControls = ({ issueId }: { issueId: number }) => {
  const { timers, elapsedFor, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimerManager()
  const [busy, setBusy] = useState(false)
  const timer = timers.find(t => t.issueId === issueId)

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try { await fn() } catch (error) { console.error('Timer action failed:', error) } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="issue-timer-controls">
      {timer && (
        <span className="font-mono text-sm font-semibold tabular-nums text-gray-900" aria-label="Timer" data-testid="issue-timer-clock">
          {formatClock(elapsedFor(timer))}
          {timer.status === 'paused' && <span className="ml-2 font-sans text-xs font-normal text-gray-500">Paused</span>}
        </span>
      )}
      {!timer && <button type="button" className={button} disabled={busy} onClick={() => run(() => startTimer(issueId))} data-testid="timer-start"><Play className="size-3" strokeWidth={1.5} aria-hidden="true" /> Start timer</button>}
      {timer?.status === 'running' && <button type="button" className={button} disabled={busy} onClick={() => run(() => pauseTimer(issueId))} data-testid="timer-pause"><Pause className="size-3" strokeWidth={1.5} aria-hidden="true" /> Pause</button>}
      {timer?.status === 'paused' && <button type="button" className={button} disabled={busy} onClick={() => run(() => resumeTimer(issueId))} data-testid="timer-resume"><Play className="size-3" strokeWidth={1.5} aria-hidden="true" /> Resume</button>}
      {timer && <button type="button" className={button} disabled={busy} onClick={() => run(() => stopTimer(issueId))} data-testid="timer-stop"><Square className="size-3 fill-current" strokeWidth={1.5} aria-hidden="true" /> Stop and log</button>}
    </div>
  )
}
