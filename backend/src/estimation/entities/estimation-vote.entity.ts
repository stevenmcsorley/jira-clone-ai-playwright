import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { SessionIssue } from './session-issue.entity'

@Entity('estimation_votes')
export class EstimationVote {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  sessionIssueId: number

  @ManyToOne(() => SessionIssue, sessionIssue => sessionIssue.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionIssueId' })
  sessionIssue: SessionIssue

  @Column()
  voterId: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'voterId' })
  voter: User

  @Column('decimal', { precision: 5, scale: 2 })
  estimate: number

  @Column()
  estimateText: string // For display (e.g., "5", "XL", "?")

  @Column({ default: 1 })
  round: number

  @Column('text', { nullable: true })
  rationale: string

  @Column({ default: false })
  isRevealed: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}