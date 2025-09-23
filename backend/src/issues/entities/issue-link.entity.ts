import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Issue } from './issue.entity'
import { User } from '../../users/entities/user.entity'

export enum IssueLinkType {
  BLOCKS = 'blocks',
  BLOCKED_BY = 'blocked_by',
  DUPLICATES = 'duplicates',
  DUPLICATED_BY = 'duplicated_by',
  RELATES_TO = 'relates_to',
  CAUSES = 'causes',
  CAUSED_BY = 'caused_by',
  CLONES = 'clones',
  CLONED_BY = 'cloned_by',
  CHILD_OF = 'child_of',
  PARENT_OF = 'parent_of',
}

@Entity('issue_links')
export class IssueLink {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  sourceIssueId: number

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceIssueId' })
  sourceIssue: Issue

  @Column()
  targetIssueId: number

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetIssueId' })
  targetIssue: Issue

  @Column({
    type: 'enum',
    enum: IssueLinkType,
  })
  linkType: IssueLinkType

  @Column()
  createdById: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User

  @CreateDateColumn()
  createdAt: Date
}