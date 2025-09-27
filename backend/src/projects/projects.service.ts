import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Project } from './entities/project.entity'
import { Issue } from '../issues/entities/issue.entity'
import { Sprint } from '../sprints/entities/sprint.entity'
import { Comment } from '../issues/entities/comment.entity'
import { Attachment } from '../issues/entities/attachment.entity'
import { TimeLog } from '../issues/entities/time-log.entity'
import { IssueLink } from '../issues/entities/issue-link.entity'
import { Subtask } from '../issues/entities/subtask.entity'
import { CreateProjectDto } from './dto/create-project.dto'

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
    @InjectRepository(TimeLog)
    private timeLogsRepository: Repository<TimeLog>,
    @InjectRepository(IssueLink)
    private issueLinksRepository: Repository<IssueLink>,
    @InjectRepository(Subtask)
    private subtasksRepository: Repository<Subtask>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepository.create(createProjectDto)
    return this.projectsRepository.save(project)
  }

  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find({
      relations: ['lead', 'issues'],
    })
  }

  async findOne(id: number): Promise<Project> {
    return this.projectsRepository.findOne({
      where: { id },
      relations: ['lead', 'issues', 'issues.assignee', 'issues.reporter'],
    })
  }

  async update(id: number, updateData: Partial<Project>): Promise<Project> {
    await this.projectsRepository.update(id, updateData)
    return this.findOne(id)
  }

  async remove(id: number): Promise<void> {
    // Get all issues for this project
    const issues = await this.issuesRepository.find({
      where: { projectId: id },
      select: ['id']
    })
    const issueIds = issues.map(issue => issue.id)

    if (issueIds.length > 0) {
      // Delete all related data for these issues in the correct order

      // 1. Delete comments (including nested comments via parent relationship)
      await this.commentsRepository.delete({ issueId: In(issueIds) })

      // 2. Delete attachments
      await this.attachmentsRepository.delete({ issueId: In(issueIds) })

      // 3. Delete time logs
      await this.timeLogsRepository.delete({ issueId: In(issueIds) })

      // 4. Delete subtasks
      await this.subtasksRepository.delete({ issueId: In(issueIds) })

      // 5. Delete issue links (both source and target)
      await this.issueLinksRepository.delete({ sourceIssueId: In(issueIds) })
      await this.issueLinksRepository.delete({ targetIssueId: In(issueIds) })
    }

    // 6. Delete all sprints in this project
    await this.sprintsRepository.delete({ projectId: id })

    // 7. Delete all issues in this project
    await this.issuesRepository.delete({ projectId: id })

    // 8. Finally delete the project
    await this.projectsRepository.delete(id)
  }
}