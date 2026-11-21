import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm'
import { Issue } from './issue.entity'
import { User } from '../../users/entities/user.entity'

export type TimerStatus = 'running' | 'paused' | 'stopped'

/**
 * One timer per person per issue. It is never deleted: stopping resets it to "stopped" with nothing accumulated,
 * so the next session starts clean. Elapsed time is derived (accumulatedMs plus the current run), never stored
 * as a ticking counter, so a restart or a second client cannot drift.
 */
@Entity('issue_timers')
@Unique(['issueId', 'userId'])
export class IssueTimer {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  issueId: number

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' })
  issue: Issue

  @Column()
  userId: number

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  @Column({ type: 'varchar', length: 10, default: 'stopped' })
  status: TimerStatus

  /** When the current run began; null unless the timer is running. */
  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null

  /** Time banked from earlier runs of this session, in milliseconds. */
  @Column({ type: 'bigint', default: 0, transformer: { to: (v: number) => v, from: (v: string | number) => Number(v) } })
  accumulatedMs: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
