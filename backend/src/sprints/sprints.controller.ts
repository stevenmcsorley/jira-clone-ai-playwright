import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { SprintsService } from './sprints.service'
import { SprintStatus } from './entities/sprint.entity'

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
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  create(@Body() createSprintDto: CreateSprintDto) {
    return this.sprintsService.create(createSprintDto)
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
  update(@Param('id') id: string, @Body() updateSprintDto: UpdateSprintDto) {
    return this.sprintsService.update(+id, updateSprintDto)
  }

  @Post(':id/start')
  startSprint(@Param('id') id: string, @Body() startSprintDto: StartSprintDto) {
    return this.sprintsService.startSprint(+id, startSprintDto.startDate, startSprintDto.endDate)
  }

  @Post(':id/complete')
  completeSprint(@Param('id') id: string) {
    return this.sprintsService.completeSprint(+id)
  }

  @Post(':id/add-issue/:issueId')
  addIssueToSprint(@Param('id') id: string, @Param('issueId') issueId: string) {
    return this.sprintsService.addIssueToSprint(+id, +issueId)
  }

  @Post('remove-issue/:issueId')
  removeIssueFromSprint(@Param('issueId') issueId: string) {
    return this.sprintsService.removeIssueFromSprint(+issueId)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sprintsService.remove(+id)
  }
}