import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProjectWebhook } from './entities/project-webhook.entity'

export const WEBHOOK_EVENTS = [
  'issue.created',
  'issue.updated',
  'issue.moved',
  'issue.done',
  'sprint.started',
  'sprint.completed',
] as const

export interface WebhookInput {
  label?: string
  url?: string
  events?: string[]
  active?: boolean
  secret?: string | null
}

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(ProjectWebhook) private readonly repo: Repository<ProjectWebhook>,
  ) {}

  /** List a project's webhooks (secret is never selected → never returned). */
  list(projectId: number): Promise<ProjectWebhook[]> {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'ASC' } })
  }

  async get(projectId: number, id: number): Promise<ProjectWebhook> {
    const hook = await this.repo.findOne({ where: { id, projectId } })
    if (!hook) throw new NotFoundException('Webhook not found')
    return hook
  }

  /** Same, but with the secret loaded — used only for a manual test delivery. */
  async getWithSecret(projectId: number, id: number): Promise<ProjectWebhook> {
    const hook = await this.repo
      .createQueryBuilder('h')
      .addSelect('h.secret')
      .where('h.id = :id', { id })
      .andWhere('h.projectId = :projectId', { projectId })
      .getOne()
    if (!hook) throw new NotFoundException('Webhook not found')
    return hook
  }

  async create(projectId: number, input: WebhookInput): Promise<ProjectWebhook> {
    const hook = this.repo.create({
      projectId,
      url: (input.url || '').trim(),
      label: (input.label || 'Chat webhook').trim(),
      events: this.cleanEvents(input.events),
      active: input.active ?? true,
      secret: input.secret?.trim() || null,
    })
    const saved = await this.repo.save(hook)
    delete (saved as Partial<ProjectWebhook>).secret
    return saved
  }

  async update(projectId: number, id: number, input: WebhookInput): Promise<ProjectWebhook> {
    const hook = await this.get(projectId, id)
    if (input.url !== undefined) hook.url = input.url.trim()
    if (input.label !== undefined) hook.label = input.label.trim()
    if (input.events !== undefined) hook.events = this.cleanEvents(input.events)
    if (input.active !== undefined) hook.active = input.active
    if (input.secret !== undefined) hook.secret = input.secret?.trim() || null
    const saved = await this.repo.save(hook)
    delete (saved as Partial<ProjectWebhook>).secret
    return saved
  }

  async remove(projectId: number, id: number): Promise<void> {
    await this.get(projectId, id)
    await this.repo.delete({ id, projectId })
  }

  /** Keep only known event names; unknown/blank entries are dropped. */
  private cleanEvents(events?: string[]): string[] {
    if (!Array.isArray(events)) return []
    const allowed = new Set<string>(WEBHOOK_EVENTS as readonly string[])
    return [...new Set(events.filter((e) => allowed.has(e)))]
  }
}
