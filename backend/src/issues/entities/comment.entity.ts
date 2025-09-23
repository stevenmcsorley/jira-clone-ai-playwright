import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Issue } from './issue.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User, user => user.comments)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: number;

  @ManyToOne(() => Issue, issue => issue.comments)
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @Column()
  issueId: number;

  @ManyToOne(() => Comment, comment => comment.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Comment;

  @Column({ nullable: true })
  parentId?: number;

  @OneToMany(() => Comment, comment => comment.parent)
  children: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ nullable: true })
  editedAt: Date;
}
