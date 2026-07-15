import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { createHmac } from 'crypto'
import { ProjectWebhook } from './entities/project-webhook.entity'
import { Project } from '../projects/entities/project.entity'
import { User } from '../users/entities/user.entity'

type IssueLike = {
  id: number; projectId: number; title?: string; status?: string
  assignee?: { name?: string } | null; assigneeId?: number | null
}
type SprintLike = { id: number; projectId: number; name?: string }

/**
 * Fire-and-forget delivery of project events to outbound webhooks (Slack / Relay etc).
 * A slow or broken destination must never break the originating mutation, so every
 * delivery is wrapped and non-blocking. Payloads carry DEEP LINKS back to the exact
 * issue / sprint so the chat message is clickable, not just a bare domain.
 */
@Injectable()
export class WebhookDispatcher {
  private readonly logger = new Logger('WebhookDispatcher')

  constructor(
    @InjectRepository(ProjectWebhook) private readonly hooks: Repository<ProjectWebhook>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  /** Public origin used to build deep links (matches the frontend's own URL). */
  private baseUrl(): string {
    const raw = process.env.PUBLIC_URL || process.env.FRONTEND_URL || 'https://ossicone.halfagiraf.com'
    return raw.replace(/\/+$/, '')
  }

  private async actorName(actorId: number | null): Promise<string> {
    if (!actorId) return 'someone'
    const u = await this.users.findOne({ where: { id: actorId } }).catch(() => null)
    return u?.name || 'someone'
  }

  /** Active webhooks for a project subscribed to this event (empty events[] = all). */
  private async targets(projectId: number, event: string): Promise<ProjectWebhook[]> {
    const all = await this.hooks
      .createQueryBuilder('h')
      .addSelect('h.secret')
      .where('h.projectId = :projectId', { projectId })
      .andWhere('h.active = true')
      .getMany()
    return all.filter((h) => !h.events?.length || h.events.includes(event))
  }

  dispatchIssue(event: string, issue: IssueLike, actorId: number | null): void {
    void this.deliverIssue(event, issue, actorId).catch((e) =>
      this.logger.warn(`issue dispatch failed: ${e?.message ?? e}`))
  }

  private async deliverIssue(event: string, issue: IssueLike, actorId: number | null): Promise<void> {
    const targets = await this.targets(issue.projectId, event)
    if (!targets.length) return
    const project = await this.projects.findOne({ where: { id: issue.projectId } })
    if (!project) return
    const actor = await this.actorName(actorId)
    const base = this.baseUrl()
    let assignee = issue.assignee?.name ?? null
    if (!assignee && issue.assigneeId) {
      assignee = (await this.users.findOne({ where: { id: issue.assigneeId } }).catch(() => null))?.name ?? null
    }
    const payload = {
      event,
      project: project.key,
      actor,
      issue: {
        key: `${project.key}-${issue.id}`,
        title: issue.title ?? '',
        status: issue.status ?? '',
        assignee,
        url: `${base}/projects/${project.id}/issues/${issue.id}`,
      },
    }
    await this.post(targets, payload)
  }

  dispatchSprint(event: string, sprint: SprintLike, actorId: number | null): void {
    void this.deliverSprint(event, sprint, actorId).catch((e) =>
      this.logger.warn(`sprint dispatch failed: ${e?.message ?? e}`))
  }

  private async deliverSprint(event: string, sprint: SprintLike, actorId: number | null): Promise<void> {
    const targets = await this.targets(sprint.projectId, event)
    if (!targets.length) return
    const project = await this.projects.findOne({ where: { id: sprint.projectId } })
    if (!project) return
    const actor = await this.actorName(actorId)
    const base = this.baseUrl()
    // started → the live board; completed → sprint history (the "report" of what shipped)
    const path = event === 'sprint.completed' ? `/projects/${project.id}/history` : `/projects/${project.id}`
    const payload = {
      event,
      project: project.key,
      actor,
      sprint: { name: sprint.name ?? '', url: `${base}${path}` },
    }
    await this.post(targets, payload)
  }

  /** Post a sample payload to a single webhook so the owner can verify it works. */
  async sendTest(hook: ProjectWebhook): Promise<{ ok: boolean; status: number }> {
    const project = await this.projects.findOne({ where: { id: hook.projectId } })
    const base = this.baseUrl()
    const key = project?.key ?? 'TEST'
    const payload = {
      event: 'issue.updated',
      project: key,
      actor: 'Ossicone',
      issue: {
        key: `${key}-0`,
        title: 'Test webhook from Ossicone 🦒',
        status: 'in_progress',
        assignee: null,
        url: `${base}/projects/${hook.projectId}`,
      },
    }
    const body = JSON.stringify(payload)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (hook.secret) {
      headers['X-Ossicone-Signature'] = 'sha256=' + createHmac('sha256', hook.secret).update(body).digest('hex')
    }
    try {
      const res = await fetch(hook.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(8000) })
      return { ok: res.ok, status: res.status }
    } catch (err) {
      this.logger.warn(`test ${hook.url} failed: ${err instanceof Error ? err.message : String(err)}`)
      return { ok: false, status: 0 }
    }
  }

  private async post(targets: ProjectWebhook[], payload: unknown): Promise<void> {
    const body = JSON.stringify(payload)
    await Promise.all(
      targets.map(async (h) => {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (h.secret) {
            headers['X-Ossicone-Signature'] = 'sha256=' + createHmac('sha256', h.secret).update(body).digest('hex')
          }
          const res = await fetch(h.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(8000) })
          if (!res.ok) this.logger.warn(`${h.url} → HTTP ${res.status}`)
        } catch (err) {
          this.logger.warn(`${h.url} failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      }),
    )
  }
}
