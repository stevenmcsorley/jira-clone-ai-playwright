import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { EstimationSession } from './estimation-session.entity'

export enum ParticipantStatus {
  INVITED = 'invited',
  JOINED = 'joined',
  VOTING = 'voting',
  VOTED = 'voted',
  LEFT = 'left',
}

@Entity('estimation_participants')
export class EstimationParticipant {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  sessionId: number

  @ManyToOne(() => EstimationSession, session => session.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: EstimationSession

  @Column()
  userId: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.INVITED,
  })
  status: ParticipantStatus

  @Column({ default: false })
  isOnline: boolean

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date

  @CreateDateColumn()
  joinedAt: Date
}