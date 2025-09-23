import { Controller, Post, Body } from '@nestjs/common'
import { SubtasksService } from '../subtasks.service'
import { CreateSubtaskDto } from '../dto/subtask.dto'

@Controller('api/public/subtasks')
export class PublicSubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Post()
  create(@Body() createSubtaskDto: CreateSubtaskDto) {
    return this.subtasksService.create(createSubtaskDto)
  }
}
