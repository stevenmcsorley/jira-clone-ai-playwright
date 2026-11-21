/**
 * Timer hooks. The timers themselves live on the server (see timerStore.ts); these hooks read them for the UI
 * and give components the actions. The hook names and shapes are the ones the board, issue page and header already use.
 */
import { useEffect, useState } from 'react'
import { TimeTrackingService } from '../services/api/time-tracking.service'
import type { Issue } from '../types/domain.types'
import type { Timer } from '../services/api/timers.service'
import { getTimerProgress, formatClock } from '../utils/timerProgress'
import {
  liveElapsed, pauseTimer, refreshTimersSoon, resumeTimer, startTimer, stopTimer, useTimerSnapshot,
} from './timerStore'

/** A clock that ticks once a second, only while something is running. */
const useNow = (active: boolean) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

const isLive = (t: Timer) => t.status === 'running' || t.status === 'paused'

// Hook for managing all timers in the application
export const useTimerManager = () => {
  const { timers, readAt, loaded } = useTimerSnapshot()
  const active = timers.filter(isLive)
  const now = useNow(active.some(t => t.status === 'running'))

  return {
    /**
     * An issue's status was just changed. The server applies the timer rules (in progress starts, todo pauses,
     * done stops and logs), so all that is left to do is look again shortly.
     */
    handleIssueStatusChange: (_issueId?: number, _newStatus?: string, _estimate?: number) => refreshTimersSoon(),
    /** Stop a timer and log its time. */
    forceStopTimer: (issueId: number) => { void stopTimer(issueId, { description: 'Manual stop - automatic time tracking' }) },
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    timers: active,
    loaded,
    elapsedFor: (t: Timer) => liveElapsed(t, readAt, now),
    activeTimersCount: active.length,
    activeTimerIds: active.map(t => t.issueId),
  }
}

// Hook for individual issue timer progress
export const useIssueTimer = (issue: Issue) => {
  const { timers, elapsedFor } = useTimerManager()
  const timer = timers.find(t => t.issueId === issue.id)
  const elapsedTime = timer ? elapsedFor(timer) : 0
  const progress = timer ? getTimerProgress(elapsedTime, issue.estimate || 0) : null

  return {
    hasActiveTimer: !!timer,
    isRunning: timer?.status === 'running',
    isPaused: timer?.status === 'paused',
    progress,
    elapsedTime,
    estimate: issue.estimate || 0,
    timer,
  }
}

// Hook for timer progress bar component
export const useTimerProgressBar = (issue: Issue) => {
  const { hasActiveTimer, elapsedTime } = useIssueTimer(issue)
  const [existingTimeSpent, setExistingTimeSpent] = useState<number>(0)

  const fetchExistingTime = async () => {
    try {
      const summary = await TimeTrackingService.getTimeTrackingSummary(issue.id)
      setExistingTimeSpent(summary.totalTimeSpent || 0)
    } catch (error) {
      console.error('Error fetching time summary:', error)
      setExistingTimeSpent(0)
    }
  }

  // Logged time changes when an issue changes status (a stop logs) and when a timer ends.
  useEffect(() => { void fetchExistingTime() }, [issue.id, issue.status, hasActiveTimer]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!issue.estimate || issue.estimate <= 0) return null

  // Total progress: time already logged plus the session that is running now
  const totalElapsedMs = existingTimeSpent * 1000 * 60 * 60 + elapsedTime
  return {
    ...getTimerProgress(totalElapsedMs, issue.estimate),
    hasActiveTimer,
    shouldShow: true,
    existingTimeSpent,
    currentSessionTime: elapsedTime / (1000 * 60 * 60), // hours
  }
}

// Hook for active timer display in header: every live timer, the one touched most recently first.
export const useActiveTimerDisplay = () => {
  const { timers, elapsedFor } = useTimerManager()
  if (timers.length === 0) return null
  const rows = timers.map(t => ({
    issueId: t.issueId,
    projectKey: t.issue?.projectKey ?? '',
    title: t.issue?.title ?? '',
    elapsedTime: formatClock(elapsedFor(t)),
    isRunning: t.status === 'running',
  }))
  return { ...rows[0], totalActiveTimers: rows.length, rows }
}
