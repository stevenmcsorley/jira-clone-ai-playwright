import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Subtask } from './entities/subtask.entity'
import { Issue } from './entities/issue.entity'
import { User } from '../users/entities/user.entity'
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto'

@Injectable()
export class SubtasksService {
  constructor(
    @InjectRepository(Subtask)
    private subtasksRepository: Repository<Subtask>,
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createSubtaskDto: CreateSubtaskDto): Promise<Subtask> {
    const issue = await this.issuesRepository.findOne({
      where: { id: createSubtaskDto.issueId }
    })
    if (!issue) {
      throw new NotFoundException('Issue not found')
    }

    let assignee: User | null = null
    if (createSubtaskDto.assigneeId) {
      assignee = await this.usersRepository.findOne({
        where: { id: createSubtaskDto.assigneeId }
      })
      if (!assignee) {
        throw new NotFoundException('Assignee not found')
      }
    }

    // Get the next position for this issue
    const maxPosition = await this.subtasksRepository
      .createQueryBuilder('subtask')
      .select('MAX(subtask.position)', 'maxPosition')
      .where('subtask.issueId = :issueId', { issueId: createSubtaskDto.issueId })
      .getRawOne()

    const position = (maxPosition?.maxPosition || 0) + 1

    const subtask = this.subtasksRepository.create({
      ...createSubtaskDto,
      issue,
      assignee,
      position,
    })

    return this.subtasksRepository.save(subtask)
  }

  async findByIssue(issueId: number): Promise<Subtask[]> {
    return this.subtasksRepository.find({
      where: { issueId },
      relations: ['assignee'],
      order: { position: 'ASC' }
    })
  }

  async findOne(id: number): Promise<Subtask> {
    const subtask = await this.subtasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'issue']
    })

    if (!subtask) {
      throw new NotFoundException('Subtask not found')
    }

    return subtask
  }

  async update(id: number, updateSubtaskDto: UpdateSubtaskDto): Promise<Subtask> {
    const subtask = await this.findOne(id)

    // Handle assignee update
    if (updateSubtaskDto.assigneeId !== undefined) {
      if (updateSubtaskDto.assigneeId === null) {
        subtask.assignee = null
        subtask.assigneeId = null
      } else {
        const assignee = await this.usersRepository.findOne({
          where: { id: updateSubtaskDto.assigneeId }
        })
        if (!assignee) {
          throw new NotFoundException('Assignee not found')
        }
        subtask.assignee = assignee
        subtask.assigneeId = updateSubtaskDto.assigneeId
      }
    }

    // Update other fields
    Object.assign(subtask, updateSubtaskDto)

    return this.subtasksRepository.save(subtask)
  }

  async remove(id: number): Promise<void> {
    const subtask = await this.findOne(id)
    await this.subtasksRepository.remove(subtask)
  }

  async reorderSubtasks(issueId: number, subtaskIds: number[]): Promise<void> {
    const subtasks = await this.findByIssue(issueId)

    for (let i = 0; i < subtaskIds.length; i++) {
      const subtask = subtasks.find(s => s.id === subtaskIds[i])
      if (subtask) {
        subtask.position = i + 1
        await this.subtasksRepository.save(subtask)
      }
    }
  }

  async getSubtaskProgress(issueId: number): Promise<{ completed: number; total: number; percentage: number }> {
    const subtasks = await this.findByIssue(issueId)
    const total = subtasks.length
    const completed = subtasks.filter(subtask => subtask.status === 'done').length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completed, total, percentage }
  }
}
