import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request, UseGuards } from '@nestjs/common'
import { CommentsService } from './comments.service'
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('api/comments')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for development
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.commentsService.create(createCommentDto, userId)
  }

  @Get('issue/:issueId')
  findByIssue(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.commentsService.findByIssue(issueId)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req
  ) {
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.commentsService.update(id, updateCommentDto, userId)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Use default user ID for development
    const userId = req.user?.id || 1
    return this.commentsService.remove(id, userId)
  }
}