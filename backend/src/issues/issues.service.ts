import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Issue } from './entities/issue.entity'
import { CreateIssueDto } from './dto/create-issue.dto'
import { Sprint } from '../sprints/entities/sprint.entity'
import { TimersService } from './timers.service'
import { NotificationsService, IssueFieldChange } from '../notifications/notifications.service'
import { WebhookDispatcher } from '../webhooks/webhook-dispatcher.service'

// Fields tracked in the issue activity history (issue_events)
const TRACKED_FIELDS = [
  'status',
  'assigneeId',
  'title',
  'priority',
  'storyPoints',
  'sprintId',
  'estimate',
  'epicId',
] as const

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    private timersService: TimersService,
    private notificationsService: NotificationsService,
    private webhooks: WebhookDispatcher,
  ) {}

  async create(createIssueDto: CreateIssueDto): Promise<Issue> {
    const issue = this.issuesRepository.create(createIssueDto)
    const saved = await this.issuesRepository.save(issue)
    this.webhooks.dispatchIssue('issue.created', saved as any, saved.reporterId ?? null)
    return saved
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

  async update(
    id: number,
    updateData: Partial<Issue>,
    actorId: number | null = null,
    options: { recordHistory?: boolean } = {},
  ): Promise<Issue> {
    const { recordHistory = true } = options

    // Get the current issue to check for status changes
    const currentIssue = await this.findOne(id)
    if (!currentIssue) {
      throw new Error('Issue not found')
    }

    // Diff tracked fields before applying the update
    const changes = recordHistory ? this.diffTrackedFields(currentIssue, updateData) : []

    // Update the issue
    await this.issuesRepository.update(id, updateData)

    // Activity history: one event per changed field (never fail the update)
    if (changes.length > 0) {
      try {
        await this.notificationsService.recordIssueEvents(id, actorId, changes)
      } catch (error) {
        console.warn('Failed to record issue events for issue', id, error)
      }
    }

    // Timers follow status, on the server, whoever moves the card (the board, the API or an agent):
    // in progress starts the mover's timer, todo pauses it, done stops it and logs the time.
    if ('status' in updateData && updateData.status !== currentIssue.status) {
      const timerUser = actorId ?? currentIssue.assigneeId ?? null
      if (timerUser) {
        try {
          await this.timersService.applyStatusChange(timerUser, id, currentIssue.status, String(updateData.status))
        } catch (error) {
          console.warn('Failed to apply timer rules for issue', id, error)
        }
      }
    }

    const updatedIssue = await this.findOne(id)

    // Outbound webhook: notify chat integrations on real status/field changes only — a pure board
    // reorder changes just `position` (status unchanged) and must NOT fire, to avoid spam.
    const statusChanged =
      'status' in updateData && String((updateData as any).status ?? '') !== String(currentIssue.status ?? '')
    let webhookEvent: string | null = null
    if (statusChanged) {
      webhookEvent = updateData.status === 'done' ? 'issue.done' : 'issue.moved'
    } else if (recordHistory && changes.some((c) => c.field !== 'status')) {
      webhookEvent = 'issue.updated'
    }
    if (webhookEvent && updatedIssue) {
      this.webhooks.dispatchIssue(webhookEvent, updatedIssue as any, actorId)
    }

    // Assignment notification: assignee changed to a real user who isn't the actor
    const assigneeChanged =
      'assigneeId' in updateData && updateData.assigneeId !== currentIssue.assigneeId
    if (assigneeChanged && updatedIssue?.assigneeId && updatedIssue.assigneeId !== actorId) {
      try {
        await this.notificationsService.createForAssignment(updatedIssue, actorId)
      } catch (error) {
        console.warn('Failed to create assignment notification for issue', id, error)
      }
    }

    return updatedIssue
  }

  /** Diff the tracked fields present in the update payload against the current issue. */
  private diffTrackedFields(currentIssue: Issue, updateData: Partial<Issue>): IssueFieldChange[] {
    const changes: IssueFieldChange[] = []

    for (const field of TRACKED_FIELDS) {
      if (!(field in updateData)) continue
      const oldValue = (currentIssue as any)[field]
      const newValue = (updateData as any)[field]
      // String-coerced comparison: DB decimals/varchars may come back as strings
      const oldStr = oldValue === null || oldValue === undefined ? null : String(oldValue)
      const newStr = newValue === null || newValue === undefined ? null : String(newValue)
      if (oldStr !== newStr) {
        changes.push({ field, oldValue: oldStr, newValue: newStr })
      }
    }

    // Description diffs are too noisy to store verbatim — just record that it changed
    if ('description' in updateData && updateData.description !== currentIssue.description) {
      changes.push({ field: 'description', oldValue: null, newValue: 'updated' })
    }

    return changes
  }

  async updatePositions(updates: { id: number; position: number; status: string }[], actorId: number | null = null): Promise<void> {
    for (const update of updates) {
      // Use the main update method to ensure auto time tracking works.
      // recordHistory: false — board reorders don't need activity events.
      await this.update(update.id, {
        position: update.position,
        status: update.status as any
      }, actorId, { recordHistory: false })
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
    },
    actorId: number | null = null
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

        // Use the main update method to ensure auto time tracking works.
        // This also records activity events per issue (cheap: same diff path
        // as a single update) and fires assignment notifications.
        await this.update(issueId, updateData, actorId);
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