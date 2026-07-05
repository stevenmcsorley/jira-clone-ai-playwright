import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Workspace } from '../../workspaces/entities/workspace.entity'
import { Issue } from '../../issues/entities/issue.entity'

export type NotificationType = 'assigned' | 'commented'

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number

  // Recipient
  @Column()
  userId: number

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  @Column()
  workspaceId: number

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace

  @Column({ type: 'varchar' })
  type: NotificationType

  // Who triggered it (null = system)
  @Column({ nullable: true })
  actorId: number | null

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actorId' })
  actor: User

  @Column()
  issueId: number

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' })
  issue: Issue

  @Column('text')
  message: string

  @Column({ default: false })
  read: boolean

  @CreateDateColumn()
  createdAt: Date
}
