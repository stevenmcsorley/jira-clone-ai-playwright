import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { Issue } from '../../issues/entities/issue.entity'
import { EstimationSession } from './estimation-session.entity'
import { EstimationVote } from './estimation-vote.entity'

export enum IssueEstimationStatus {
  PENDING = 'pending',
  VOTING = 'voting',
  DISCUSSING = 'discussing',
  ESTIMATED = 'estimated',
  SKIPPED = 'skipped',
}

@Entity('session_issues')
export class SessionIssue {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  sessionId: number

  @ManyToOne(() => EstimationSession, session => session.sessionIssues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: EstimationSession

  @Column()
  issueId: number

  @ManyToOne(() => Issue)
  @JoinColumn({ name: 'issueId' })
  issue: Issue

  @Column({
    type: 'enum',
    enum: IssueEstimationStatus,
    default: IssueEstimationStatus.PENDING,
  })
  status: IssueEstimationStatus

  @Column({ default: 0 })
  position: number

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  finalEstimate: number

  @Column({ default: false })
  hasConsensus: boolean

  @Column({ default: 0 })
  votingRound: number

  @Column('text', { nullable: true })
  discussionNotes: string

  @OneToMany(() => EstimationVote, vote => vote.sessionIssue)
  votes: EstimationVote[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}