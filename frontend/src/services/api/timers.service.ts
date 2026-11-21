import { BaseApiService } from './base.service'

export type TimerStatus = 'running' | 'paused' | 'stopped'

/** A person's timer on one issue. `elapsedMs` is the server's reading at the moment it answered. */
export interface Timer {
  issueId: number
  userId: number
  status: TimerStatus
  elapsedMs: number
  startedAt: string | null
  /** Hours written to the time log, on the response to a stop. */
  loggedHours?: number
  issue?: { id: number; title: string; status: string; projectId: number; projectKey?: string; estimate?: number }
}

export class TimersService extends BaseApiService {
  static list(): Promise<Timer[]> {
    return this.get<Timer[]>('/timers')
  }
  static start(issueId: number): Promise<Timer> {
    return this.post<Timer>(`/timers/issue/${issueId}/start`, {})
  }
  static pause(issueId: number): Promise<Timer> {
    return this.post<Timer>(`/timers/issue/${issueId}/pause`, {})
  }
  static resume(issueId: number): Promise<Timer> {
    return this.post<Timer>(`/timers/issue/${issueId}/resume`, {})
  }
  /** Stop and log the time, or pass log:false to throw the session away. */
  static stop(issueId: number, options: { log?: boolean; description?: string } = {}): Promise<Timer> {
    return this.post<Timer>(`/timers/issue/${issueId}/stop`, options)
  }
  /** Adopt timers that were running in this browser before timers moved to the server. */
  static importLocal(timers: Array<{ issueId: number; elapsedMs: number; status: 'running' | 'paused' }>): Promise<Timer[]> {
    return this.post<Timer[]>('/timers/import', { timers })
  }
}
