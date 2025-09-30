import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { SprintsService } from './sprints.service'
import { SprintStatus } from './entities/sprint.entity'
import { EventsGateway } from '../events/events.gateway'

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
    private readonly eventsGateway: EventsGateway
  ) {}

  @Post()
  async create(@Body() createSprintDto: CreateSprintDto) {
    const sprint = await this.sprintsService.create(createSprintDto)
    this.eventsGateway.emitSprintCreated(sprint)
    return sprint
  }

  @Get()
  findByProject(@Query('projectId') projectId: string) {
    return this.sprintsService.findByProject(+projectId)
  }

  @Get('backlog')
  getBacklog(@Query('projectId') projectId: string) {
    return this.sprintsService.getBacklogIssues(+projectId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sprintsService.findOne(+id)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSprintDto: UpdateSprintDto) {
    const sprint = await this.sprintsService.update(+id, updateSprintDto)
    this.eventsGateway.emitSprintUpdated(sprint)
    return sprint
  }

  @Post(':id/start')
  async startSprint(@Param('id') id: string, @Body() startSprintDto: StartSprintDto) {
    const sprint = await this.sprintsService.startSprint(+id, startSprintDto.startDate, startSprintDto.endDate)
    this.eventsGateway.emitSprintStarted(sprint)
    return sprint
  }

  @Post(':id/complete')
  async completeSprint(@Param('id') id: string) {
    const sprint = await this.sprintsService.completeSprint(+id)
    this.eventsGateway.emitSprintCompleted(sprint)
    return sprint
  }

  @Post(':id/add-issue/:issueId')
  async addIssueToSprint(@Param('id') id: string, @Param('issueId') issueId: string) {
    await this.sprintsService.addIssueToSprint(+id, +issueId)
    const sprint = await this.sprintsService.findOne(+id)
    this.eventsGateway.emitSprintUpdated(sprint)
  }

  @Post('remove-issue/:issueId')
  async removeIssueFromSprint(@Param('issueId') issueId: string) {
    await this.sprintsService.removeIssueFromSprint(+issueId)
    this.eventsGateway.emitIssueUpdated({ id: +issueId })
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.sprintsService.remove(+id)
    this.eventsGateway.emitSprintDeleted(+id)
    return { message: 'Sprint deleted successfully' }
  }
}