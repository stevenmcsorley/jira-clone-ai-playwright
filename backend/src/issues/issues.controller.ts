import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common'
import { IssuesService } from './issues.service'
import { CreateIssueDto } from './dto/create-issue.dto'
import { EventsGateway } from '../events/events.gateway'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

@Controller('api/issues')
export class IssuesController {
  constructor(
    private readonly issuesService: IssuesService,
    private readonly eventsGateway: EventsGateway,
    private readonly workspaceScope: WorkspaceScopeService
  ) {}

  @Post()
  async create(@Body() createIssueDto: CreateIssueDto, @Req() req: any) {
    await this.workspaceScope.assertProject(createIssueDto.projectId, req.workspaceId)
    const issue = await this.issuesService.create(createIssueDto)
    this.eventsGateway.emitIssueCreated(issue)
    return issue
  }

  @Get()
  async findAll(@Req() req: any, @Query('projectId') projectId?: string, @Query('boardView') boardView?: string) {
    if (projectId) {
      await this.workspaceScope.assertProject(+projectId, req.workspaceId)
      if (boardView === 'true') {
        // Return only issues that should appear on the main Kanban board
        return this.issuesService.findForBoard(+projectId)
      }
      return this.issuesService.findByProject(+projectId)
    }
    // No project filter: restrict to the projects of the current workspace
    const workspaceProjectIds = await this.workspaceScope.projectIds(req.workspaceId)
    const issues = await this.issuesService.findAll()
    return issues.filter(issue => workspaceProjectIds.includes(issue.projectId))
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    await this.workspaceScope.assertIssue(+id, req.workspaceId)
    return this.issuesService.findOne(+id)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<CreateIssueDto>, @Req() req: any) {
    await this.workspaceScope.assertIssue(+id, req.workspaceId)
    if (updateData.projectId) {
      await this.workspaceScope.assertProject(updateData.projectId, req.workspaceId)
    }
    const issue = await this.issuesService.update(+id, updateData)
    this.eventsGateway.emitIssueUpdated(issue)
    return issue
  }

  @Post('reorder')
  async updatePositions(@Body() updates: { id: number; position: number; status: string }[], @Req() req: any) {
    for (const update of updates) {
      await this.workspaceScope.assertIssue(update.id, req.workspaceId)
    }
    const result = await this.issuesService.updatePositions(updates)
    // Emit update event for each changed issue
    for (const update of updates) {
      const issue = await this.issuesService.findOne(update.id)
      this.eventsGateway.emitIssueUpdated(issue)
    }
    return result
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.workspaceScope.assertIssue(+id, req.workspaceId)
    const issue = await this.issuesService.findOne(+id)
    await this.issuesService.remove(+id)
    this.eventsGateway.emitIssueDeleted(+id, issue.projectId)
    return { message: 'Issue deleted successfully' }
  }

  @Post('search')
  async search(@Body() searchData: { query: string; projectId?: number }, @Req() req: any) {
    if (searchData.projectId) {
      await this.workspaceScope.assertProject(searchData.projectId, req.workspaceId)
      return this.issuesService.search(searchData.query, searchData.projectId)
    }
    // No project filter: restrict results to the projects of the current workspace
    const workspaceProjectIds = await this.workspaceScope.projectIds(req.workspaceId)
    const { results } = await this.issuesService.search(searchData.query)
    const scoped = results.filter(issue => workspaceProjectIds.includes(issue.projectId))
    return { results: scoped, totalResults: scoped.length }
  }

  @Post('bulk-update')
  async bulkUpdate(@Body() bulkUpdateData: {
    issueIds: number[];
    operation: {
      type: 'assign' | 'status' | 'labels' | 'priority' | 'sprint' | 'estimate' | 'component' | 'version';
      field: string;
      value: any;
    };
  }, @Req() req: any) {
    for (const issueId of bulkUpdateData.issueIds) {
      await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    }
    return this.issuesService.bulkUpdate(bulkUpdateData.issueIds, bulkUpdateData.operation)
  }
}
