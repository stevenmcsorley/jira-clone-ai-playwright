import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Workspace } from './workspace.entity'
import { User } from '../../users/entities/user.entity'
import { WorkspaceRole } from './workspace-member.entity'

@Entity('workspace_invites')
export class WorkspaceInvite {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  workspaceId: number

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace

  @Column()
  email: string

  @Column({ default: 'member' })
  role: WorkspaceRole

  @Column({ unique: true })
  token: string

  @Column()
  invitedById: number

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User

  @Column()
  expiresAt: Date

  @Column({ nullable: true })
  acceptedAt: Date

  @CreateDateColumn()
  createdAt: Date
}
