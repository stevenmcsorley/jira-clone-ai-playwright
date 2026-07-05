import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Issue } from '../../issues/entities/issue.entity'

@Entity('issue_events')
export class IssueEvent {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  issueId: number

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' })
  issue: Issue

  // Who made the change (null = system)
  @Column({ nullable: true })
  actorId: number | null

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actorId' })
  actor: User

  @Column({ type: 'varchar' })
  field: string

  @Column('text', { nullable: true })
  oldValue: string | null

  @Column('text', { nullable: true })
  newValue: string | null

  @CreateDateColumn()
  createdAt: Date
}
