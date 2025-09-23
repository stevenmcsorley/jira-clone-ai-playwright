import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Issue } from './issue.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  path: string;

  @ManyToOne(() => User, user => user.attachments)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column()
  uploadedById: number;

  @ManyToOne(() => Issue, issue => issue.attachments)
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @Column()
  issueId: number;

  @CreateDateColumn()
  createdAt: Date;
}
