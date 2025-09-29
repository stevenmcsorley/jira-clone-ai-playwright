import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Issue } from './entities/issue.entity'
import { CreateIssueDto } from './dto/create-issue.dto'
import { Sprint } from '../sprints/entities/sprint.entity'
import { TimeTrackingService } from './time-tracking.service'

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    private timeTrackingService: TimeTrackingService,
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
    // Get the current issue to check for status changes
    const currentIssue = await this.findOne(id)
    if (!currentIssue) {
      throw new Error('Issue not found')
    }

    // Check if status is changing from in_progress to done
    const isStatusChangeToDone = currentIssue.status === 'in_progress' && updateData.status === 'done'

    // Update the issue
    await this.issuesRepository.update(id, updateData)

    // Auto time tracking: log time when moving from in_progress to done
    if (isStatusChangeToDone && currentIssue.assigneeId) {
      try {
        // Calculate time spent since last status change to in_progress
        // For now, we'll use a simplified calculation based on updatedAt
        const timeSpentHours = this.calculateTimeSpent(currentIssue.updatedAt)
        console.log(`Auto time tracking: Issue ${id}, time spent: ${timeSpentHours} hours, assignee: ${currentIssue.assigneeId}`)

        if (timeSpentHours > 0) {
          console.log(`Logging time for issue ${id}: ${timeSpentHours} hours`)
          await this.timeTrackingService.logTime({
            issueId: id,
            hours: timeSpentHours,
            date: new Date().toISOString(),
            description: 'Auto-logged time (in_progress → done)'
          }, currentIssue.assigneeId)
          console.log(`Time logged successfully for issue ${id}`)
        } else {
          console.log(`No time to log for issue ${id} (time spent: ${timeSpentHours})`)
        }
      } catch (error) {
        console.warn('Failed to auto-log time for issue', id, error)
        // Don't fail the update if time tracking fails
      }
    }

    return this.findOne(id)
  }

  private calculateTimeSpent(lastUpdated: Date): number {
    const now = new Date()
    const diffMs = now.getTime() - lastUpdated.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    // Round to 15-minute increments and cap at reasonable limits
    const roundedHours = Math.round(diffHours * 4) / 4  // Round to 0.25h increments

    // Only log if between 1 minute and 8 hours (reasonable work session)
    // Minimum 1 minute to avoid noise from quick status changes
    if (roundedHours >= 0.017 && roundedHours <= 8) { // 0.017 hours = 1 minute
      return Math.max(roundedHours, 0.25) // Always log at least 15 minutes for completed work
    }

    return 0
  }

  async updatePositions(updates: { id: number; position: number; status: string }[]): Promise<void> {
    for (const update of updates) {
      // Use the main update method to ensure auto time tracking works
      await this.update(update.id, {
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

  async bulkUpdate(
    issueIds: number[],
    operation: {
      type: 'assign' | 'status' | 'labels' | 'priority' | 'sprint' | 'estimate' | 'component' | 'version';
      field: string;
      value: any;
    }
  ): Promise<{ successCount: number; failureCount: number; errors: Array<{ issueId: number; error: string }> }> {
    const errors: Array<{ issueId: number; error: string }> = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each issue individually to handle potential failures
    for (const issueId of issueIds) {
      try {
        const updateData: Partial<Issue> = {};

        // Build update data based on operation type
        switch (operation.type) {
          case 'assign':
            updateData.assigneeId = operation.value;
            break;
          case 'status':
            updateData.status = operation.value;
            break;
          case 'priority':
            updateData.priority = operation.value;
            break;
          case 'sprint':
            updateData.sprintId = operation.value;
            break;
          case 'estimate':
            updateData.estimate = operation.value;
            break;
          case 'labels':
            // For labels, we need special handling
            const currentIssue = await this.issuesRepository.findOne({ where: { id: issueId } });
            if (!currentIssue) {
              throw new Error('Issue not found');
            }

            let updatedLabels = [...currentIssue.labels];

            if (operation.field === 'add') {
              if (!updatedLabels.includes(operation.value)) {
                updatedLabels.push(operation.value);
              }
            } else if (operation.field === 'remove') {
              updatedLabels = updatedLabels.filter(label => label !== operation.value);
            } else {
              // Replace all labels
              updatedLabels = [operation.value];
            }

            updateData.labels = updatedLabels;
            break;
          default:
            throw new Error(`Unsupported operation type: ${operation.type}`);
        }

        // Use the main update method to ensure auto time tracking works
        await this.update(issueId, updateData);
        successCount++;

      } catch (error) {
        errors.push({
          issueId,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        failureCount++;
      }
    }

    return {
      successCount,
      failureCount,
      errors
    };
  }
}