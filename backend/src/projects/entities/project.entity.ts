import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Issue } from '../../issues/entities/issue.entity'
import { Sprint } from '../../sprints/entities/sprint.entity'

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column({ unique: true })
  key: string

  @Column({ nullable: true })
  description: string

  @Column()
  leadId: number

  @ManyToOne(() => User, user => user.ledProjects)
  @JoinColumn({ name: 'leadId' })
  lead: User

  @OneToMany(() => Issue, issue => issue.project)
  issues: Issue[]

  @OneToMany(() => Sprint, sprint => sprint.project)
  sprints: Sprint[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}