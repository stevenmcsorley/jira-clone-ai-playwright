import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { WorkspaceMember } from './workspace-member.entity'
import { Project } from '../../projects/entities/project.entity'

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  /** Named monochrome icon key (see frontend workspaceIcons), shown in the sidebar / switcher. */
  @Column({ type: 'varchar', length: 32, nullable: true })
  icon: string | null

  /** Optional custom icon: a small resized image stored as a data: URL. Takes precedence over `icon`. */
  @Column({ type: 'text', nullable: true })
  iconImage: string | null

  @OneToMany(() => WorkspaceMember, member => member.workspace)
  members: WorkspaceMember[]

  @OneToMany(() => Project, project => project.workspace)
  projects: Project[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
