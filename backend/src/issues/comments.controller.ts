import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request, UseGuards } from '@nestjs/common'
import { CommentsService } from './comments.service'
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

@Controller('api/comments')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for development
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly workspaceScope: WorkspaceScopeService,
  ) {}

  @Post()
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    await this.workspaceScope.assertIssue(createCommentDto.issueId, req.workspaceId)
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.commentsService.create(createCommentDto, userId)
  }

  @Get('issue/:issueId')
  async findByIssue(@Param('issueId', ParseIntPipe) issueId: number, @Request() req) {
    await this.workspaceScope.assertIssue(issueId, req.workspaceId)
    return this.commentsService.findByIssue(issueId)
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const comment = await this.commentsService.findOne(id)
    await this.workspaceScope.assertIssue(comment.issueId, req.workspaceId)
    return comment
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req
  ) {
    const comment = await this.commentsService.findOne(id)
    await this.workspaceScope.assertIssue(comment.issueId, req.workspaceId)
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.commentsService.update(id, updateCommentDto, userId)
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const comment = await this.commentsService.findOne(id)
    await this.workspaceScope.assertIssue(comment.issueId, req.workspaceId)
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.commentsService.remove(id, userId)
  }
}
