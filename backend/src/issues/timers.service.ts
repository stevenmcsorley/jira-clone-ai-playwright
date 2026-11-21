import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IssueTimer } from './entities/issue-timer.entity'
import { Issue } from './entities/issue.entity'
import { TimeTrackingService } from './time-tracking.service'
import { EventsGateway } from '../events/events.gateway'

const HOUR_MS = 3_600_000

/** Milliseconds on the clock: banked time plus the current run, if there is one. */
export const elapsedMs = (timer: Pick<IssueTimer, 'status' | 'startedAt' | 'accumulatedMs'>, now: number = Date.now()): number =>
  (timer.accumulatedMs || 0) + (timer.status === 'running' && timer.startedAt ? Math.max(0, now - new Date(timer.startedAt).getTime()) : 0)

/** Hours to record in the time log: two decimals, because that is what the log stores. */
export const loggableHours = (ms: number): number => Math.round((ms / HOUR_MS) * 100) / 100

export interface TimerView {
  issueId: number
  userId: number
  status: 'running' | 'paused' | 'stopped'
  elapsedMs: number
  startedAt: string | null
  issue?: { id: number; title: string; status: string; projectId: number; projectKey?: string; estimate?: number }
}

export interface StopResult extends TimerView {
  loggedHours: number
}

@Injectable()
export class TimersService {
  constructor(
    @InjectRepository(IssueTimer) private readonly timers: Repository<IssueTimer>,
    @InjectRepository(Issue) private readonly issues: Repository<Issue>,
    private readonly timeTracking: TimeTrackingService,
    private readonly events: EventsGateway,
  ) {}

  private async issueOrThrow(issueId: number): Promise<Issue> {
    const issue = await this.issues.findOne({ where: { id: issueId }, relations: ['project'] })
    if (!issue) throw new NotFoundException('Issue not found')
    return issue
  }

  private view(timer: IssueTimer, issue?: Issue, now = Date.now()): TimerView {
    return {
      issueId: timer.issueId,
      userId: timer.userId,
      status: timer.status,
      elapsedMs: elapsedMs(timer, now),
      startedAt: timer.status === 'running' && timer.startedAt ? new Date(timer.startedAt).toISOString() : null,
      issue: issue
        ? { id: issue.id, title: issue.title, status: issue.status, projectId: issue.projectId, projectKey: issue.project?.key, estimate: issue.estimate ?? undefined }
        : undefined,
    }
  }

  private async find(userId: number, issueId: number): Promise<IssueTimer | null> {
    return this.timers.findOne({ where: { userId, issueId } })
  }

  private changed(userId: number, issue: Issue) {
    try { this.events.emitTimersChanged(userId, issue) } catch { /* a missing socket must never fail a timer action */ }
  }

  /** Every running or paused timer this person has, most recently touched first. */
  async list(userId: number, workspaceProjectIds?: number[]): Promise<TimerView[]> {
    const rows = await this.timers.find({ where: [{ userId, status: 'running' }, { userId, status: 'paused' }], order: { updatedAt: 'DESC' } })
    const out: TimerView[] = []
    const now = Date.now()
    for (const row of rows) {
      const issue = await this.issues.findOne({ where: { id: row.issueId }, relations: ['project'] })
      if (!issue) continue
      if (workspaceProjectIds && !workspaceProjectIds.includes(issue.projectId)) continue
      out.push(this.view(row, issue, now))
    }
    return out
  }

  async get(userId: number, issueId: number): Promise<TimerView> {
    const issue = await this.issueOrThrow(issueId)
    const timer = await this.find(userId, issueId)
    const stub = { issueId, userId, status: 'stopped', startedAt: null, accumulatedMs: 0 } as IssueTimer
    return this.view(timer ?? stub, issue)
  }

  /** Start a timer, or resume it if it is paused. Starting a running timer changes nothing. */
  async start(userId: number, issueId: number): Promise<TimerView> {
    const issue = await this.issueOrThrow(issueId)
    let timer = await this.find(userId, issueId)
    if (!timer) timer = this.timers.create({ issueId, userId, status: 'stopped', startedAt: null, accumulatedMs: 0 })
    if (timer.status !== 'running') {
      timer.status = 'running'
      timer.startedAt = new Date()
      // A stopped timer starts a fresh session (it has nothing banked); a paused one keeps what it banked.
      timer = await this.timers.save(timer)
      this.changed(userId, issue)
    }
    return this.view(timer, issue)
  }

  /** Pause: bank the current run and stop the clock. Pausing something not running changes nothing. */
  async pause(userId: number, issueId: number): Promise<TimerView> {
    const issue = await this.issueOrThrow(issueId)
    const timer = await this.find(userId, issueId)
    if (!timer || timer.status === 'stopped') throw new BadRequestException('There is no running timer on this issue')
    if (timer.status === 'running') {
      timer.accumulatedMs = elapsedMs(timer)
      timer.startedAt = null
      timer.status = 'paused'
      await this.timers.save(timer)
      this.changed(userId, issue)
    }
    return this.view(timer, issue)
  }

  async resume(userId: number, issueId: number): Promise<TimerView> {
    const timer = await this.find(userId, issueId)
    if (!timer || timer.status === 'stopped') throw new BadRequestException('There is no paused timer on this issue')
    return this.start(userId, issueId)
  }

  /**
   * Stop: close the session. By default the time is written to the issue's time log; pass log=false to discard it.
   * Returns what was logged so a caller (a person or an agent) can say so.
   */
  async stop(userId: number, issueId: number, options: { log?: boolean; description?: string } = {}): Promise<StopResult> {
    const { log = true, description } = options
    const issue = await this.issueOrThrow(issueId)
    const timer = await this.find(userId, issueId)
    if (!timer || timer.status === 'stopped') throw new BadRequestException('There is no timer to stop on this issue')
    const total = elapsedMs(timer)
    const hours = loggableHours(total)
    let loggedHours = 0
    if (log && hours > 0) {
      await this.timeTracking.logTime({ issueId, hours, description: description ?? 'Timer session', date: new Date().toISOString() } as any, userId)
      loggedHours = hours
    }
    timer.status = 'stopped'
    timer.startedAt = null
    timer.accumulatedMs = 0
    await this.timers.save(timer)
    this.changed(userId, issue)
    return { ...this.view(timer, issue), elapsedMs: total, loggedHours }
  }

  /** Stop every timer this person has, logging each. */
  async stopAll(userId: number, options: { log?: boolean; description?: string } = {}): Promise<StopResult[]> {
    const active = await this.list(userId)
    const results: StopResult[] = []
    for (const t of active) results.push(await this.stop(userId, t.issueId, options))
    return results
  }

  /**
   * An issue moved between statuses. The rules the board has always had, now applied on the server so a move made
   * by an agent behaves exactly like a drag: in progress starts (or resumes) the timer, todo pauses it,
   * done stops it and logs the time. Code review leaves a running timer running.
   */
  async applyStatusChange(userId: number, issueId: number, previousStatus: string | undefined, newStatus: string): Promise<void> {
    if (newStatus === previousStatus) return
    const timer = await this.find(userId, issueId)
    const live = timer && timer.status !== 'stopped'
    if (newStatus === 'in_progress') {
      await this.start(userId, issueId)
    } else if (newStatus === 'todo' && live && timer!.status === 'running') {
      await this.pause(userId, issueId)
    } else if (newStatus === 'done' && live) {
      await this.stop(userId, issueId, { log: true, description: 'Automatic time tracking session' })
    }
  }

  /** Adopt timers that were running in a browser before timers moved to the server. Existing server timers win. */
  async importLocal(userId: number, items: Array<{ issueId: number; elapsedMs: number; status: 'running' | 'paused' }>): Promise<TimerView[]> {
    const out: TimerView[] = []
    for (const item of items) {
      if (!Number.isFinite(item.elapsedMs) || item.elapsedMs < 0 || item.elapsedMs > 24 * HOUR_MS) continue
      const issue = await this.issues.findOne({ where: { id: item.issueId }, relations: ['project'] })
      if (!issue) continue
      const existing = await this.find(userId, item.issueId)
      if (existing && existing.status !== 'stopped') continue
      const timer = existing ?? this.timers.create({ issueId: item.issueId, userId })
      timer.accumulatedMs = Math.round(item.elapsedMs)
      timer.status = item.status
      timer.startedAt = item.status === 'running' ? new Date() : null
      out.push(this.view(await this.timers.save(timer), issue))
    }
    return out
  }
}
