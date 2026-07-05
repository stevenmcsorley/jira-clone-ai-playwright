import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Project } from '../../projects/entities/project.entity'

/**
 * One linked git repository per project. The access token is stored with
 * `select: false` so it is never included in ordinary queries or serialised
 * responses — it is only pulled in deliberately (addSelect) when the service
 * needs to talk to the provider.
 */
@Entity('project_repos')
export class ProjectRepo {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  projectId: number

  @OneToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project

  @Column({ default: 'github' })
  provider: string

  @Column()
  owner: string

  @Column()
  repo: string

  @Column({ select: false, nullable: true })
  token: string | null

  @Column({ nullable: true })
  defaultBranch: string | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
