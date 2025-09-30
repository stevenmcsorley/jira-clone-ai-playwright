import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { IssuesService } from './issues.service'
import { CreateIssueDto } from './dto/create-issue.dto'
import { EventsGateway } from '../events/events.gateway'

@Controller('api/issues')
export class IssuesController {
  constructor(
    private readonly issuesService: IssuesService,
    private readonly eventsGateway: EventsGateway
  ) {}

  @Post()
  async create(@Body() createIssueDto: CreateIssueDto) {
    const issue = await this.issuesService.create(createIssueDto)
    this.eventsGateway.emitIssueCreated(issue)
    return issue
  }

  @Get()
  findAll(@Query('projectId') projectId?: string, @Query('boardView') boardView?: string) {
    if (projectId) {
      if (boardView === 'true') {
        // Return only issues that should appear on the main Kanban board
        return this.issuesService.findForBoard(+projectId)
      }
      return this.issuesService.findByProject(+projectId)
    }
    return this.issuesService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.issuesService.findOne(+id)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<CreateIssueDto>) {
    const issue = await this.issuesService.update(+id, updateData)
    this.eventsGateway.emitIssueUpdated(issue)
    return issue
  }

  @Post('reorder')
  async updatePositions(@Body() updates: { id: number; position: number; status: string }[]) {
    const result = await this.issuesService.updatePositions(updates)
    // Emit update event for each changed issue
    for (const update of updates) {
      const issue = await this.issuesService.findOne(update.id)
      this.eventsGateway.emitIssueUpdated(issue)
    }
    return result
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.issuesService.remove(+id)
    this.eventsGateway.emitIssueDeleted(+id)
    return { message: 'Issue deleted successfully' }
  }

  @Post('search')
  search(@Body() searchData: { query: string; projectId?: number }) {
    return this.issuesService.search(searchData.query, searchData.projectId)
  }

  @Post('bulk-update')
  bulkUpdate(@Body() bulkUpdateData: {
    issueIds: number[];
    operation: {
      type: 'assign' | 'status' | 'labels' | 'priority' | 'sprint' | 'estimate' | 'component' | 'version';
      field: string;
      value: any;
    };
  }) {
    return this.issuesService.bulkUpdate(bulkUpdateData.issueIds, bulkUpdateData.operation)
  }
}