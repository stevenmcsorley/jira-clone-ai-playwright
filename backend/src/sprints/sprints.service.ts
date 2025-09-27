import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull, Not } from 'typeorm'
import { Sprint, SprintStatus } from './entities/sprint.entity'
import { Issue } from '../issues/entities/issue.entity'

interface CreateSprintDto {
  name: string
  goal?: string
  projectId: number
  createdById: number
}

interface UpdateSprintDto {
  name?: string
  goal?: string
  status?: SprintStatus
  startDate?: Date
  endDate?: Date
}

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
  ) {}

  async create(createSprintDto: CreateSprintDto): Promise<Sprint> {
    // Get the next position for this project
    const lastSprint = await this.sprintsRepository.findOne({
      where: { projectId: createSprintDto.projectId },
      order: { position: 'DESC' },
    })

    const position = lastSprint ? lastSprint.position + 1 : 0

    const sprint = this.sprintsRepository.create({
      ...createSprintDto,
      position,
    })

    return this.sprintsRepository.save(sprint)
  }

  async findByProject(projectId: number): Promise<Sprint[]> {
    return this.sprintsRepository.find({
      where: { projectId },
      relations: ['issues', 'issues.assignee', 'issues.reporter', 'issues.project'],
      order: { position: 'ASC' },
    })
  }

  async findOne(id: number): Promise<Sprint> {
    const sprint = await this.sprintsRepository.findOne({
      where: { id },
      relations: ['issues', 'issues.assignee', 'issues.reporter', 'project'],
    })

    if (!sprint) {
      throw new Error('Sprint not found')
    }

    return sprint
  }

  async update(id: number, updateSprintDto: UpdateSprintDto): Promise<Sprint> {
    await this.sprintsRepository.update(id, updateSprintDto)
    return this.findOne(id)
  }

  async remove(id: number): Promise<void> {
    // Move all issues back to backlog before deleting sprint
    await this.issuesRepository.update(
      { sprintId: id },
      { sprintId: null }
    )

    await this.sprintsRepository.delete(id)
  }

  async startSprint(id: number, startDate: Date, endDate: Date): Promise<Sprint> {
    return this.update(id, {
      status: SprintStatus.ACTIVE,
      startDate,
      endDate,
    })
  }

  async completeSprint(id: number): Promise<Sprint> {
    // Only move incomplete issues back to backlog (not "done" status)
    // This matches real Jira behavior where completed issues stay in sprint for historical tracking
    await this.issuesRepository.update(
      {
        sprintId: id,
        status: Not('done' as any)
      },
      { sprintId: null }
    )

    return this.update(id, {
      status: SprintStatus.COMPLETED,
    })
  }

  async addIssueToSprint(sprintId: number, issueId: number): Promise<void> {
    await this.issuesRepository.update(issueId, { sprintId })
  }

  async removeIssueFromSprint(issueId: number): Promise<void> {
    await this.issuesRepository.update(issueId, { sprintId: null })
  }

  async getBacklogIssues(projectId: number): Promise<Issue[]> {
    return this.issuesRepository.find({
      where: {
        projectId,
        sprintId: IsNull(), // Issues not assigned to any sprint
      },
      relations: ['assignee', 'reporter', 'epic'],
      order: { position: 'ASC' },
    })
  }
}