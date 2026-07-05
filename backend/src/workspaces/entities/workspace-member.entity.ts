import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { Workspace } from './workspace.entity'
import { User } from '../../users/entities/user.entity'

export type WorkspaceRole = 'owner' | 'admin' | 'member'

@Entity('workspace_members')
@Unique(['workspaceId', 'userId'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  workspaceId: number

  @ManyToOne(() => Workspace, workspace => workspace.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace

  @Column()
  userId: number

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  @Column({ default: 'member' })
  role: WorkspaceRole

  @CreateDateColumn()
  createdAt: Date
}
