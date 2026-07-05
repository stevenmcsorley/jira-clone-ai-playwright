import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification, NotificationType } from './entities/notification.entity'
import { IssueEvent } from './entities/issue-event.entity'
import { User } from '../users/entities/user.entity'
import { Issue } from '../issues/entities/issue.entity'
import { EventsGateway } from '../events/events.gateway'

export interface IssueFieldChange {
  field: string
  oldValue: string | null
  newValue: string | null
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(IssueEvent)
    private readonly issueEventsRepository: Repository<IssueEvent>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ---------- Notifications ----------

  /** Notify the new assignee of an issue. Issue must have the project relation loaded. */
  async createForAssignment(issue: Issue, actorId: number | null): Promise<void> {
    const workspaceId = issue.project?.workspaceId
    if (!issue.assigneeId || !workspaceId) return
    if (actorId && issue.assigneeId === actorId) return // don't notify yourself

    const actorName = await this.actorName(actorId)
    await this.createAndEmit({
      userId: issue.assigneeId,
      workspaceId,
      type: 'assigned',
      actorId,
      issueId: issue.id,
      message: `${actorName} assigned you to "${issue.title}"`,
    })
  }

  /** Notify assignee + reporter (deduped, minus the commenter) of a new comment. */
  async createForComment(issue: Issue, actorId: number | null): Promise<void> {
    const workspaceId = issue.project?.workspaceId
    if (!workspaceId) return

    const recipients = [...new Set([issue.assigneeId, issue.reporterId])].filter(
      userId => userId && userId !== actorId,
    )
    if (recipients.length === 0) return

    const actorName = await this.actorName(actorId)
    for (const userId of recipients) {
      await this.createAndEmit({
        userId,
        workspaceId,
        type: 'commented',
        actorId,
        issueId: issue.id,
        message: `${actorName} commented on "${issue.title}"`,
      })
    }
  }

  async list(userId: number, workspaceId: number) {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationsRepository.find({
        where: { userId, workspaceId },
        relations: ['actor', 'issue'],
        order: { createdAt: 'DESC' },
        take: 30,
      }),
      this.notificationsRepository.count({
        where: { userId, workspaceId, read: false },
      }),
    ])

    return {
      notifications: notifications.map(n => this.toPlain(n)),
      unreadCount,
    }
  }

  async markRead(id: number, userId: number) {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
      relations: ['actor', 'issue'],
    })
    // 404 (not 403) for other users' notifications so their existence isn't leaked
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found')
    }
    if (!notification.read) {
      notification.read = true
      await this.notificationsRepository.save(notification)
    }
    return this.toPlain(notification)
  }

  async markAllRead(userId: number, workspaceId: number) {
    await this.notificationsRepository.update(
      { userId, workspaceId, read: false },
      { read: true },
    )
    return { success: true }
  }

  // ---------- Issue activity history ----------

  async recordIssueEvents(
    issueId: number,
    actorId: number | null,
    changes: IssueFieldChange[],
  ): Promise<void> {
    if (changes.length === 0) return
    const events = changes.map(change =>
      this.issueEventsRepository.create({
        issueId,
        actorId,
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
      }),
    )
    await this.issueEventsRepository.save(events)
  }

  async issueHistory(issueId: number) {
    const events = await this.issueEventsRepository.find({
      where: { issueId },
      relations: ['actor'],
      order: { createdAt: 'DESC', id: 'DESC' },
    })
    return events.map(event => ({
      id: event.id,
      issueId: event.issueId,
      field: event.field,
      oldValue: event.oldValue,
      newValue: event.newValue,
      createdAt: event.createdAt,
      actor: event.actor ? { id: event.actor.id, name: event.actor.name } : null,
    }))
  }

  // ---------- Internals ----------

  private async createAndEmit(data: {
    userId: number
    workspaceId: number
    type: NotificationType
    actorId: number | null
    issueId: number
    message: string
  }): Promise<void> {
    const saved = await this.notificationsRepository.save(
      this.notificationsRepository.create(data),
    )
    const withRelations = await this.notificationsRepository.findOne({
      where: { id: saved.id },
      relations: ['actor', 'issue'],
    })
    if (withRelations) {
      this.eventsGateway.emitNotification(data.workspaceId, this.toPlain(withRelations))
    }
  }

  private async actorName(actorId: number | null): Promise<string> {
    if (!actorId) return 'System'
    const actor = await this.usersRepository.findOne({ where: { id: actorId } })
    return actor?.name || 'Someone'
  }

  private toPlain(n: Notification) {
    return {
      id: n.id,
      userId: n.userId,
      workspaceId: n.workspaceId,
      type: n.type,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt,
      actor: n.actor ? { id: n.actor.id, name: n.actor.name } : null,
      issue: n.issue
        ? { id: n.issue.id, title: n.issue.title, projectId: n.issue.projectId }
        : null,
    }
  }
}
