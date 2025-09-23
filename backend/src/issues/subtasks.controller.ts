import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common'
import { SubtasksService } from './subtasks.service'
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('api/subtasks')
@UseGuards(JwtAuthGuard)
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Post()
  create(@Body() createSubtaskDto: CreateSubtaskDto) {
    return this.subtasksService.create(createSubtaskDto)
  }

  @Get('issue/:issueId')
  findByIssue(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.subtasksService.findByIssue(issueId)
  }

  @Get('issue/:issueId/progress')
  getProgress(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.subtasksService.getSubtaskProgress(issueId)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subtasksService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSubtaskDto: UpdateSubtaskDto) {
    return this.subtasksService.update(id, updateSubtaskDto)
  }

  @Post('issue/:issueId/reorder')
  reorderSubtasks(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Body() body: { subtaskIds: number[] }
  ) {
    return this.subtasksService.reorderSubtasks(issueId, body.subtaskIds)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subtasksService.remove(id)
  }
}