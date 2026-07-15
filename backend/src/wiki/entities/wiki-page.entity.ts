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
 * A single markdown wiki/docs page belonging to a project. Pages are unique per
 * (project, slug) so a project can hold a whole documentation set — architecture,
 * runbooks, deploy notes, decisions, and (since Ossicone is a private store) creds.
 */
@Entity('wiki_pages')
@Index('UQ_wiki_project_slug', ['projectId', 'slug'], { unique: true })
export class WikiPage {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  projectId: number

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project

  @Column()
  title: string

  @Column()
  slug: string

  @Column({ type: 'text', default: '' })
  content: string

  @Column({ nullable: true })
  authorId: number | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
