import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Issue } from '../../issues/entities/issue.entity'
import { Sprint } from '../../sprints/entities/sprint.entity'
import { Workspace } from '../../workspaces/entities/workspace.entity'

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column({ unique: true })
  key: string

  @Column({ nullable: true })
  description: string

  // Nullable at DB level so synchronize can add it to existing rows;
  // the application always sets it (workspace context guard + backfill migration)
  @Column({ nullable: true })
  workspaceId: number

  @ManyToOne(() => Workspace, workspace => workspace.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace

  @Column()
  leadId: number

  @ManyToOne(() => User, user => user.ledProjects)
  @JoinColumn({ name: 'leadId' })
  lead: User

  @OneToMany(() => Issue, issue => issue.project)
  issues: Issue[]

  @OneToMany(() => Sprint, sprint => sprint.project)
  sprints: Sprint[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}