import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Project } from '../../projects/entities/project.entity'
import { Issue } from '../../issues/entities/issue.entity'
import { Comment } from '../../issues/entities/comment.entity'
import { Attachment } from '../../issues/entities/attachment.entity'
import { Subtask } from '../../issues/entities/subtask.entity'
import { TimeLog } from '../../issues/entities/time-log.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  email: string

  @Column()
  name: string

  @Column({ nullable: true })
  avatar: string

  @Column()
  password: string

  @OneToMany(() => Project, project => project.lead)
  ledProjects: Project[]

  @OneToMany(() => Issue, issue => issue.assignee)
  assignedIssues: Issue[]

  @OneToMany(() => Issue, issue => issue.reporter)
  reportedIssues: Issue[]

  @OneToMany(() => Comment, comment => comment.author)
  comments: Comment[]

  @OneToMany(() => Attachment, attachment => attachment.uploadedBy)
  attachments: Attachment[]

  @OneToMany(() => Subtask, subtask => subtask.assignee)
  assignedSubtasks: Subtask[]

  @OneToMany(() => TimeLog, timeLog => timeLog.user)
  timeLogs: TimeLog[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
