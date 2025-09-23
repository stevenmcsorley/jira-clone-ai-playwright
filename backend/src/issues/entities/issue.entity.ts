import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Project } from '../../projects/entities/project.entity'

export enum IssueStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

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

  @Column({ nullable: true })
  estimate: number

  @Column('text', { array: true, default: [] })
  labels: string[]

  @Column({ type: 'integer', default: 0 })
  position: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}