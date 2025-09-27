import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Issue } from './entities/issue.entity'
import { CreateIssueDto } from './dto/create-issue.dto'
import { Sprint } from '../sprints/entities/sprint.entity'

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
      relations: ['project', 'assignee', 'reporter', 'epic', 'epicIssues'],
    })
  }

  async findByProject(projectId: number): Promise<Issue[]> {
    return this.issuesRepository.find({
      where: { projectId },
      relations: ['project', 'assignee', 'reporter', 'epic', 'epicIssues'],
      order: { position: 'ASC', createdAt: 'DESC' },
    })
  }

  // Get issues for the main Kanban board - only shows active sprint issues
  async findForBoard(projectId: number): Promise<Issue[]> {
    // First check if there's an active sprint for this project
    const activeSprint = await this.issuesRepository.manager
      .getRepository('Sprint')
      .findOne({
        where: { projectId, status: 'active' }
      });

    // If no active sprint, return empty board (like real Jira)
    if (!activeSprint) {
      return [];
    }

    // Return issues from the active sprint only
    return this.issuesRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.project', 'project')
      .leftJoinAndSelect('issue.assignee', 'assignee')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('issue.epic', 'epic')
      .leftJoinAndSelect('issue.epicIssues', 'epicIssues')
      .leftJoinAndSelect('epicIssues.assignee', 'epicIssuesAssignee')
      .where('issue.projectId = :projectId', { projectId })
      .andWhere('issue.sprintId = :sprintId', { sprintId: activeSprint.id })
      .orderBy('issue.position', 'ASC')
      .addOrderBy('issue.createdAt', 'DESC')
      .getMany()
  }

  async findOne(id: number): Promise<Issue> {
    return this.issuesRepository.findOne({
      where: { id },
      relations: ['project', 'assignee', 'reporter', 'epic', 'epicIssues', 'epicIssues.assignee'],
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

  async search(query: string, projectId?: number): Promise<{ results: Issue[]; totalResults: number }> {
    const queryBuilder = this.issuesRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.project', 'project')
      .leftJoinAndSelect('issue.assignee', 'assignee')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('issue.epic', 'epic')

    // Parse basic JQL-like syntax
    const conditions = this.parseSearchQuery(query, queryBuilder)

    if (projectId) {
      queryBuilder.andWhere('issue.projectId = :projectId', { projectId })
    }

    // Apply parsed conditions
    conditions.forEach(condition => {
      queryBuilder.andWhere(condition.sql, condition.params)
    })

    // Get total count
    const totalResults = await queryBuilder.getCount()

    // Get results with pagination
    const results = await queryBuilder
      .orderBy('issue.updatedAt', 'DESC')
      .limit(20)
      .getMany()

    return { results, totalResults }
  }

  private parseSearchQuery(query: string, queryBuilder: any): Array<{ sql: string; params: any }> {
    const conditions: Array<{ sql: string; params: any }> = []

    if (!query) return conditions

    // Simple text search across title and description
    if (!query.includes('=') && !query.includes('IN')) {
      conditions.push({
        sql: '("issue"."title" ILIKE :searchText OR "issue"."description" ILIKE :searchText)',
        params: { searchText: `%${query}%` }
      })
      return conditions
    }

    // Parse JQL-like syntax
    const parts = query.split(/\s+AND\s+/i)

    parts.forEach((part, index) => {
      const trimmed = part.trim()

      // project = VALUE
      const projectMatch = trimmed.match(/project\s*=\s*([A-Z]+)/i)
      if (projectMatch) {
        conditions.push({
          sql: `"project"."key" = :projectKey${index}`,
          params: { [`projectKey${index}`]: projectMatch[1] }
        })
        return
      }

      // assignee = VALUE
      const assigneeMatch = trimmed.match(/assignee\s*=\s*['"]*([^'"]+)['"]*$/i)
      if (assigneeMatch) {
        conditions.push({
          sql: `"assignee"."name" = :assigneeUsername${index}`,
          params: { [`assigneeUsername${index}`]: assigneeMatch[1] }
        })
        return
      }

      // status IN (value1, value2)
      const statusInMatch = trimmed.match(/status\s+IN\s*\(([^)]+)\)/i)
      if (statusInMatch) {
        const statuses = statusInMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''))
        conditions.push({
          sql: `"issue"."status" IN (:...statuses${index})`,
          params: { [`statuses${index}`]: statuses }
        })
        return
      }

      // status = VALUE
      const statusMatch = trimmed.match(/status\s*=\s*(\w+)/i)
      if (statusMatch) {
        conditions.push({
          sql: `"issue"."status" = :status${index}`,
          params: { [`status${index}`]: statusMatch[1] }
        })
        return
      }

      // priority = VALUE
      const priorityMatch = trimmed.match(/priority\s*=\s*(\w+)/i)
      if (priorityMatch) {
        conditions.push({
          sql: `"issue"."priority" = :priority${index}`,
          params: { [`priority${index}`]: priorityMatch[1] }
        })
        return
      }

      // type = VALUE
      const typeMatch = trimmed.match(/type\s*=\s*(\w+)/i)
      if (typeMatch) {
        conditions.push({
          sql: `"issue"."type" = :type${index}`,
          params: { [`type${index}`]: typeMatch[1] }
        })
        return
      }
    })

    return conditions
  }
}