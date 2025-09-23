import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Project } from '../../projects/entities/project.entity'
import { Issue } from '../../issues/entities/issue.entity'

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

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}