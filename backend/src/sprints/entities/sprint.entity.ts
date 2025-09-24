import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { Project } from '../../projects/entities/project.entity'
import { Issue } from '../../issues/entities/issue.entity'
import { User } from '../../users/entities/user.entity'

export enum SprintStatus {
  FUTURE = 'future',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

@Entity('sprints')
export class Sprint {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column('text', { nullable: true })
  goal: string

  @Column({
    type: 'enum',
    enum: SprintStatus,
    default: SprintStatus.FUTURE,
  })
  status: SprintStatus

  @Column()
  projectId: number

  @ManyToOne(() => Project, project => project.sprints)
  @JoinColumn({ name: 'projectId' })
  project: Project

  @Column({ nullable: true })
  startDate: Date

  @Column({ nullable: true })
  endDate: Date

  @Column({ default: 0 })
  position: number

  @OneToMany(() => Issue, issue => issue.sprint)
  issues: Issue[]

  @Column()
  createdById: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}