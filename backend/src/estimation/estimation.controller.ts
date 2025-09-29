import { Controller, Get, Post, Put, Body, Param, Query, BadRequestException } from '@nestjs/common'
import { EstimationService } from './estimation.service'
import { EstimationScalesService } from './estimation-scales.service'
import { EstimationScale } from './entities/estimation-session.entity'

interface CreateSessionDto {
  name: string
  description?: string
  projectId: number
  sprintId?: number
  facilitatorId: number
  estimationScale?: EstimationScale
  anonymousVoting?: boolean
  discussionTimeLimit?: number
  autoReveal?: boolean
  issueIds: number[]
}

interface VoteDto {
  estimate: number
  estimateText: string
  rationale?: string
}

interface FinalizeEstimateDto {
  finalEstimate: number
}

@Controller('api/estimation')
export class EstimationController {
  constructor(private readonly estimationService: EstimationService) {}

  // Create new estimation session
  @Post('sessions')
  async createSession(@Body() createSessionDto: CreateSessionDto) {
    return this.estimationService.createSession(createSessionDto)
  }

  // Get session details
  @Get('sessions/:id')
  async getSession(@Param('id') id: number) {
    return this.estimationService.getSession(id)
  }

  // Get sessions by project
  @Get('sessions')
  async getSessionsByProject(@Query('projectId') projectId: number) {
    if (!projectId) {
      throw new BadRequestException('projectId is required')
    }
    return this.estimationService.getSessionsByProject(projectId)
  }

  // Add participant to session
  @Post('sessions/:id/participants')
  async addParticipant(
    @Param('id') sessionId: number,
    @Body('userId') userId: number
  ) {
    return this.estimationService.addParticipant(sessionId, userId)
  }

  // Start estimation session
  @Post('sessions/:id/start')
  async startSession(
    @Param('id') sessionId: number,
    @Body('facilitatorId') facilitatorId: number
  ) {
    return this.estimationService.startSession(sessionId, facilitatorId)
  }

  // Start voting on current issue
  @Post('sessions/:id/start-voting')
  async startVoting(
    @Param('id') sessionId: number,
    @Body('facilitatorId') facilitatorId: number
  ) {
    return this.estimationService.startVoting(sessionId, facilitatorId)
  }

  // Submit vote
  @Post('sessions/:sessionId/issues/:issueId/vote')
  async submitVote(
    @Param('sessionId') sessionId: number,
    @Param('issueId') issueId: number,
    @Body('voterId') voterId: number,
    @Body('vote') voteData: VoteDto
  ) {
    return this.estimationService.submitVote(sessionId, issueId, voterId, voteData)
  }

  // Reveal votes
  @Post('sessions/:sessionId/issues/:issueId/reveal')
  async revealVotes(
    @Param('sessionId') sessionId: number,
    @Param('issueId') issueId: number,
    @Body('facilitatorId') facilitatorId: number
  ) {
    return this.estimationService.revealVotes(sessionId, issueId, facilitatorId)
  }

  // Finalize estimate
  @Put('sessions/:sessionId/issues/:issueId/finalize')
  async finalizeEstimate(
    @Param('sessionId') sessionId: number,
    @Param('issueId') issueId: number,
    @Body('facilitatorId') facilitatorId: number,
    @Body() { finalEstimate }: FinalizeEstimateDto
  ) {
    return this.estimationService.finalizeEstimate(sessionId, issueId, facilitatorId, finalEstimate)
  }

  // Move to next issue
  @Post('sessions/:id/next-issue')
  async moveToNextIssue(
    @Param('id') sessionId: number,
    @Body('facilitatorId') facilitatorId: number
  ) {
    return this.estimationService.moveToNextIssue(sessionId, facilitatorId)
  }

  // Start new voting round
  @Post('sessions/:sessionId/issues/:issueId/new-round')
  async startNewRound(
    @Param('sessionId') sessionId: number,
    @Param('issueId') issueId: number,
    @Body('facilitatorId') facilitatorId: number
  ) {
    return this.estimationService.startNewRound(sessionId, issueId, facilitatorId)
  }

  // Get estimation scales
  @Get('scales')
  getEstimationScales() {
    return this.estimationService.getEstimationScales()
  }

  // Get vote statistics
  @Get('sessions/:sessionId/issues/:issueId/stats')
  async getVoteStatistics(
    @Param('sessionId') sessionId: number,
    @Param('issueId') issueId: number,
    @Query('round') round: number = 1
  ) {
    const sessionIssueId = parseInt(issueId.toString()) // This would need proper lookup
    return this.estimationService.getVoteStatistics(sessionIssueId, round)
  }
}