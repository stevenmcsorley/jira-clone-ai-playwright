import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Project } from '../../projects/entities/project.entity'
import { Comment } from './comment.entity'
import { Attachment } from './attachment.entity'
import { Subtask } from './subtask.entity'
import { TimeLog } from './time-log.entity'
import { IssueLink } from './issue-link.entity'
import { Sprint } from '../../sprints/entities/sprint.entity'
import { IssueStatus } from '../enums/issue-status.enum'

export enum IssuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum IssueType {
  STORY = 'story',
  TASK = 'task',
  BUG = 'bug',
  EPIC = 'epic',
}

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column('text', { nullable: true })
  description: string

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.TODO,
  })
  status: IssueStatus

  @Column({
    type: 'enum',
    enum: IssuePriority,
    default: IssuePriority.MEDIUM,
  })
  priority: IssuePriority

  @Column({
    type: 'enum',
    enum: IssueType,
    default: IssueType.TASK,
  })
  type: IssueType

  @Column()
  projectId: number

  @ManyToOne(() => Project, project => project.issues)
  @JoinColumn({ name: 'projectId' })
  project: Project

  @Column({ nullable: true })
  assigneeId: number

  @ManyToOne(() => User, user => user.assignedIssues, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User

  @Column()
  reporterId: number

  @ManyToOne(() => User, user => user.reportedIssues)
  @JoinColumn({ name: 'reporterId' })
  reporter: User

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  estimate: number

  @Column('text', { array: true, default: [] })
  labels: string[]

  @Column({ type: 'integer', default: 0 })
  position: number

  @Column({ nullable: true })
  epicId: number

  @ManyToOne(() => Issue, epic => epic.epicIssues, { nullable: true })
  @JoinColumn({ name: 'epicId' })
  epic: Issue

  @OneToMany(() => Issue, issue => issue.epic)
  epicIssues: Issue[]

  @Column({ nullable: true })
  sprintId: number

  @ManyToOne(() => Sprint, sprint => sprint.issues, { nullable: true })
  @JoinColumn({ name: 'sprintId' })
  sprint: Sprint

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => Comment, comment => comment.issue)
  comments: Comment[]

  @OneToMany(() => Attachment, attachment => attachment.issue)
  attachments: Attachment[]

  @OneToMany(() => Subtask, subtask => subtask.issue)
  subtasks: Subtask[]

  @OneToMany(() => TimeLog, timeLog => timeLog.issue)
  timeLogs: TimeLog[]

  @OneToMany(() => IssueLink, link => link.sourceIssue)
  sourceLinks: IssueLink[]

  @OneToMany(() => IssueLink, link => link.targetIssue)
  targetLinks: IssueLink[]

  @UpdateDateColumn()
  updatedAt: Date
}
