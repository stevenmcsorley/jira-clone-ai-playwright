import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Issue } from './issue.entity';

@Entity('time_logs')
export class TimeLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal')
  hours: number;

  @Column()
  date: Date;

  @Column('text', { nullable: true })
  description: string;

  @ManyToOne(() => User, user => user.timeLogs)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Issue, issue => issue.timeLogs)
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @Column()
  issueId: number;

  @CreateDateColumn()
  createdAt: Date;
}
