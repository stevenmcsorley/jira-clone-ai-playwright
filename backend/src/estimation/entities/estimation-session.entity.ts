import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Project } from '../../projects/entities/project.entity'
import { Sprint } from '../../sprints/entities/sprint.entity'
import { EstimationParticipant } from './estimation-participant.entity'
import { SessionIssue } from './session-issue.entity'

export enum EstimationScale {
  FIBONACCI = 'fibonacci',
  TSHIRT = 'tshirt',
  HOURS = 'hours',
  DAYS = 'days',
  POWER_OF_2 = 'power_of_2',
  LINEAR = 'linear',
  MODIFIED_FIBONACCI = 'modified_fibonacci',
  STORY_POINTS = 'story_points',
}

export enum SessionStatus {
  CREATED = 'created',
  WAITING = 'waiting',
  VOTING = 'voting',
  DISCUSSING = 'discussing',
  COMPLETED = 'completed',
}

@Entity('estimation_sessions')
export class EstimationSession {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column('text', { nullable: true })
  description: string

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.CREATED,
  })
  status: SessionStatus

  @Column({
    type: 'enum',
    enum: EstimationScale,
    default: EstimationScale.FIBONACCI,
  })
  estimationScale: EstimationScale

  @Column({ default: false })
  anonymousVoting: boolean

  @Column({ default: 120 })
  discussionTimeLimit: number // seconds

  @Column({ default: true })
  autoReveal: boolean

  @Column({ nullable: true })
  currentIssueId: number

  @Column({ nullable: true })
  facilitatorId: number

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'facilitatorId' })
  facilitator: User

  @Column()
  projectId: number

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project

  @Column({ nullable: true })
  sprintId: number

  @ManyToOne(() => Sprint, { nullable: true })
  @JoinColumn({ name: 'sprintId' })
  sprint: Sprint

  @OneToMany(() => EstimationParticipant, participant => participant.session)
  participants: EstimationParticipant[]

  @OneToMany(() => SessionIssue, sessionIssue => sessionIssue.session)
  sessionIssues: SessionIssue[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}