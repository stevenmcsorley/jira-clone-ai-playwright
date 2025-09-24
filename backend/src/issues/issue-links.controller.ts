import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common'
import { IssueLinksService } from './issue-links.service'
import { IssueLinkType } from './entities/issue-link.entity'

interface CreateIssueLinkDto {
  sourceIssueId: number
  targetIssueId: number
  linkType: IssueLinkType
  createdById: number
}

@Controller('api/issue-links')
export class IssueLinksController {
  constructor(private readonly issueLinksService: IssueLinksService) {}

  @Post()
  create(@Body() createIssueLinkDto: CreateIssueLinkDto) {
    return this.issueLinksService.create(createIssueLinkDto)
  }

  @Get('issue/:issueId')
  findByIssueId(@Param('issueId') issueId: string) {
    return this.issueLinksService.findByIssueId(+issueId)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.issueLinksService.remove(+id)
  }

  @Get('search')
  searchIssues(
    @Query('query') query: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.issueLinksService.searchIssues(query, projectId ? +projectId : undefined)
  }
}