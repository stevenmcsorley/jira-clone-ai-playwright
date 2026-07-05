import { Controller, Get, Post, Body, Param, Delete, Query, Req } from '@nestjs/common'
import { IssueLinksService } from './issue-links.service'
import { IssueLinkType } from './entities/issue-link.entity'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

interface CreateIssueLinkDto {
  sourceIssueId: number
  targetIssueId: number
  linkType: IssueLinkType
  createdById: number
}

@Controller('api/issue-links')
export class IssueLinksController {
  constructor(
    private readonly issueLinksService: IssueLinksService,
    private readonly workspaceScope: WorkspaceScopeService,
  ) {}

  @Post()
  async create(@Body() createIssueLinkDto: CreateIssueLinkDto, @Req() req: any) {
    await this.workspaceScope.assertIssue(createIssueLinkDto.sourceIssueId, req.workspaceId)
    await this.workspaceScope.assertIssue(createIssueLinkDto.targetIssueId, req.workspaceId)
    return this.issueLinksService.create({ ...createIssueLinkDto, createdById: req.user.id })
  }

  @Get('issue/:issueId')
  async findByIssueId(@Param('issueId') issueId: string, @Req() req: any) {
    await this.workspaceScope.assertIssue(+issueId, req.workspaceId)
    return this.issueLinksService.findByIssueId(+issueId)
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const link = await this.issueLinksService.findOne(+id)
    await this.workspaceScope.assertIssue(link.sourceIssueId, req.workspaceId)
    return this.issueLinksService.remove(+id)
  }

  @Get('search')
  async searchIssues(
    @Query('query') query: string,
    @Query('projectId') projectId: string | undefined,
    @Req() req: any,
  ) {
    if (projectId) {
      await this.workspaceScope.assertProject(+projectId, req.workspaceId)
      return this.issueLinksService.searchIssues(query, +projectId)
    }
    // No project filter: restrict results to the projects of the current workspace
    const workspaceProjectIds = await this.workspaceScope.projectIds(req.workspaceId)
    const issues = await this.issueLinksService.searchIssues(query)
    return issues.filter(issue => workspaceProjectIds.includes(issue.projectId))
  }
}
