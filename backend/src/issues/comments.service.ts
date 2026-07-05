import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Comment } from './entities/comment.entity'
import { Issue } from './entities/issue.entity'
import { User } from '../users/entities/user.entity'
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createCommentDto: CreateCommentDto, authorId: number): Promise<Comment> {
    // 'project' relation is needed by the notification (workspaceId resolution)
    const issue = await this.issuesRepository.findOne({
      where: { id: createCommentDto.issueId },
      relations: ['project'],
    })
    if (!issue) {
      throw new NotFoundException('Issue not found')
    }

    const author = await this.usersRepository.findOne({
      where: { id: authorId }
    })
    if (!author) {
      throw new NotFoundException('Author not found')
    }

    let parent: Comment | null = null
    if (createCommentDto.parentId) {
      parent = await this.commentsRepository.findOne({
        where: { id: createCommentDto.parentId }
      })
      if (!parent) {
        throw new NotFoundException('Parent comment not found')
      }
    }

    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      issue,
      author,
      parent,
      issueId: createCommentDto.issueId,
      authorId,
      parentId: createCommentDto.parentId,
    })

    const saved = await this.commentsRepository.save(comment)

    // Notify assignee + reporter (minus the commenter) — never fail the comment
    try {
      await this.notificationsService.createForComment(issue, authorId)
    } catch (error) {
      console.warn('Failed to create comment notifications for issue', issue.id, error)
    }

    return saved
  }

  async findByIssue(issueId: number): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { issueId },
      relations: ['author', 'children', 'children.author'],
      order: { createdAt: 'ASC' }
    })
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['author', 'issue', 'parent', 'children']
    })

    if (!comment) {
      throw new NotFoundException('Comment not found')
    }

    return comment
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number): Promise<Comment> {
    const comment = await this.findOne(id)

    if (comment.authorId !== userId) {
      throw new NotFoundException('You can only edit your own comments')
    }

    if (updateCommentDto.content) {
      comment.content = updateCommentDto.content
      comment.isEdited = true
      comment.editedAt = new Date()
    }

    return this.commentsRepository.save(comment)
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.findOne(id)

    if (comment.authorId !== userId) {
      throw new NotFoundException('You can only delete your own comments')
    }

    await this.commentsRepository.remove(comment)
  }
}