import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { IssuesService } from './issues.service'
import { CreateIssueDto } from './dto/create-issue.dto'

@Controller('api/issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  create(@Body() createIssueDto: CreateIssueDto) {
    return this.issuesService.create(createIssueDto)
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    if (projectId) {
      return this.issuesService.findByProject(+projectId)
    }
    return this.issuesService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.issuesService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<CreateIssueDto>) {
    return this.issuesService.update(+id, updateData)
  }

  @Post('reorder')
  updatePositions(@Body() updates: { id: number; position: number; status: string }[]) {
    return this.issuesService.updatePositions(updates)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.issuesService.remove(+id)
  }
}