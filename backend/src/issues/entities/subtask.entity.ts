import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Issue } from './issue.entity';
import { IssueStatus } from '../enums/issue-status.enum';

@Entity('subtasks')
export class Subtask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  completed: boolean;

  @ManyToOne(() => Issue, issue => issue.subtasks)
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @Column()
  issueId: number;

  @ManyToOne(() => User, user => user.assignedSubtasks, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee?: User;

  @Column({ nullable: true })
  assigneeId?: number;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.TODO
  })
  status: IssueStatus;
}
