import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Issue } from './entities/issue.entity'
import { CreateIssueDto } from './dto/create-issue.dto'

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
  ) {}

  async create(createIssueDto: CreateIssueDto): Promise<Issue> {
    const issue = this.issuesRepository.create(createIssueDto)
    return this.issuesRepository.save(issue)
  }

  async findAll(): Promise<Issue[]> {
    return this.issuesRepository.find({
      relations: ['project', 'assignee', 'reporter'],
    })
  }

  async findByProject(projectId: number): Promise<Issue[]> {
    return this.issuesRepository.find({
      where: { projectId },
      relations: ['project', 'assignee', 'reporter'],
      order: { position: 'ASC', createdAt: 'DESC' },
    })
  }

  async findOne(id: number): Promise<Issue> {
    return this.issuesRepository.findOne({
      where: { id },
      relations: ['project', 'assignee', 'reporter'],
    })
  }

  async update(id: number, updateData: Partial<Issue>): Promise<Issue> {
    await this.issuesRepository.update(id, updateData)
    return this.findOne(id)
  }

  async updatePositions(updates: { id: number; position: number; status: string }[]): Promise<void> {
    for (const update of updates) {
      await this.issuesRepository.update(update.id, {
        position: update.position,
        status: update.status as any
      })
    }
  }

  async remove(id: number): Promise<void> {
    await this.issuesRepository.delete(id)
  }
}