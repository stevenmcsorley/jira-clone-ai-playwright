import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { WorkspaceMember } from './workspace-member.entity'
import { Project } from '../../projects/entities/project.entity'

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @OneToMany(() => WorkspaceMember, member => member.workspace)
  members: WorkspaceMember[]

  @OneToMany(() => Project, project => project.workspace)
  projects: Project[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
