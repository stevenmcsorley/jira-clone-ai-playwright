import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Project } from '../../projects/entities/project.entity'

/**
 * An outbound webhook for a project — posts issue/sprint activity to an external chat
 * (Slack / Relay incoming webhook, etc). A project may have several (one per channel).
 * The optional signing secret is stored with `select: false` so it never leaks into
 * ordinary queries/responses; it's only pulled in deliberately when signing a delivery.
 */
@Entity('project_webhooks')
export class ProjectWebhook {
  @PrimaryGeneratedColumn()
  id: number

  @Index()
  @Column()
  projectId: number

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project

  /** Human label shown in settings (e.g. "#dev in Relay"). */
  @Column({ default: 'Chat webhook' })
  label: string

  /** The destination URL we POST event payloads to. */
  @Column()
  url: string

  /** Which event types to deliver. Empty = all events. */
  @Column('text', { array: true, default: '{}' })
  events: string[]

  @Column({ default: true })
  active: boolean

  /** Optional shared secret — sent as X-Ossicone-Signature (HMAC-SHA256 of the body). */
  @Column({ select: false, nullable: true })
  secret: string | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
