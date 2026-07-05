import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request, UseGuards } from '@nestjs/common'
import { SubtasksService } from './subtasks.service'
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

@Controller('api/subtasks')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for development
export class SubtasksController {
  constructor(
    private readonly subtasksService: SubtasksService,
    private readonly workspaceScope: WorkspaceScopeService,
  ) {}

  @Post()
  async create(@Body() createSubtaskDto: CreateSubtaskDto, @Request() req) {
    await this.workspaceScope.assertIssue(createSubtaskDto.issueId, req.workspaceId)
    return this.subtasksService.create(createSubtaskDto)
  }

  @Get('issue/:issueId')
  async findByIssue(@Param('issueId', ParseIntPipe) issueId: number, @Request() req) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.subtasksService.findByIssue(issueId)
  }

  @Get('issue/:issueId/progress')
  async getProgress(@Param('issueId', ParseIntPipe) issueId: number, @Request() req) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.subtasksService.getSubtaskProgress(issueId)
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const subtask = await this.subtasksService.findOne(id)
    await this.workspaceScope.assertIssue(subtask.issueId, req.workspaceId)
    return subtask
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateSubtaskDto: UpdateSubtaskDto, @Request() req) {
    const subtask = await this.subtasksService.findOne(id)
    await this.workspaceScope.assertIssue(subtask.issueId, req.workspaceId)
    return this.subtasksService.update(id, updateSubtaskDto)
  }

  @Post('issue/:issueId/reorder')
  async reorderSubtasks(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Body() body: { subtaskIds: number[] },
    @Request() req
  ) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.subtasksService.reorderSubtasks(issueId, body.subtaskIds)
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const subtask = await this.subtasksService.findOne(id)
    await this.workspaceScope.assertIssue(subtask.issueId, req.workspaceId)
    return this.subtasksService.remove(id)
  }
}
