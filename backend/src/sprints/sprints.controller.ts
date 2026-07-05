import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common'
import { SprintsService } from './sprints.service'
import { SprintStatus } from './entities/sprint.entity'
import { EventsGateway } from '../events/events.gateway'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

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

interface StartSprintDto {
  startDate: Date
  endDate: Date
}

@Controller('api/sprints')
export class SprintsController {
  constructor(
    private readonly sprintsService: SprintsService,
    private readonly eventsGateway: EventsGateway,
    private readonly workspaceScope: WorkspaceScopeService
  ) {}

  /** Load a sprint and 404 unless its project belongs to the request's workspace. */
  private async assertSprint(id: number, workspaceId: number) {
    const sprint = await this.sprintsService.findOne(id)
    await this.workspaceScope.assertProject(sprint.projectId, workspaceId)
    return sprint
  }

  @Post()
  async create(@Body() createSprintDto: CreateSprintDto, @Req() req: any) {
    await this.workspaceScope.assertProject(createSprintDto.projectId, req.workspaceId)
    const sprint = await this.sprintsService.create(createSprintDto)
    this.eventsGateway.emitSprintCreated(sprint)
    return sprint
  }

  @Get()
  async findByProject(@Query('projectId') projectId: string, @Req() req: any) {
    await this.workspaceScope.assertProject(+projectId, req.workspaceId)
    return this.sprintsService.findByProject(+projectId)
  }

  @Get('backlog')
  async getBacklog(@Query('projectId') projectId: string, @Req() req: any) {
    await this.workspaceScope.assertProject(+projectId, req.workspaceId)
    return this.sprintsService.getBacklogIssues(+projectId)
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.assertSprint(+id, req.workspaceId)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSprintDto: UpdateSprintDto, @Req() req: any) {
    await this.assertSprint(+id, req.workspaceId)
    const sprint = await this.sprintsService.update(+id, updateSprintDto)
    this.eventsGateway.emitSprintUpdated(sprint)
    return sprint
  }

  @Post(':id/start')
  async startSprint(@Param('id') id: string, @Body() startSprintDto: StartSprintDto, @Req() req: any) {
    await this.assertSprint(+id, req.workspaceId)
    const sprint = await this.sprintsService.startSprint(+id, startSprintDto.startDate, startSprintDto.endDate)
    this.eventsGateway.emitSprintStarted(sprint)
    return sprint
  }

  @Post(':id/complete')
  async completeSprint(@Param('id') id: string, @Req() req: any) {
    await this.assertSprint(+id, req.workspaceId)
    const sprint = await this.sprintsService.completeSprint(+id)
    this.eventsGateway.emitSprintCompleted(sprint)
    return sprint
  }

  @Post(':id/add-issue/:issueId')
  async addIssueToSprint(@Param('id') id: string, @Param('issueId') issueId: string, @Req() req: any) {
    await this.assertSprint(+id, req.workspaceId)
    await this.workspaceScope.assertIssue(+issueId, req.workspaceId)
    await this.sprintsService.addIssueToSprint(+id, +issueId)
    const sprint = await this.sprintsService.findOne(+id)
    this.eventsGateway.emitSprintUpdated(sprint)
  }

  @Post('remove-issue/:issueId')
  async removeIssueFromSprint(@Param('issueId') issueId: string, @Req() req: any) {
    await this.workspaceScope.assertIssue(+issueId, req.workspaceId)
    await this.sprintsService.removeIssueFromSprint(+issueId)
    this.eventsGateway.emitIssueUpdated({ id: +issueId })
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const sprint = await this.assertSprint(+id, req.workspaceId)
    await this.sprintsService.remove(+id)
    this.eventsGateway.emitSprintDeleted(+id, sprint.projectId)
    return { message: 'Sprint deleted successfully' }
  }
}
