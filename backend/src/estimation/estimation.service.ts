import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { EstimationSession, SessionStatus, EstimationScale } from './entities/estimation-session.entity'
import { EstimationParticipant, ParticipantStatus } from './entities/estimation-participant.entity'
import { SessionIssue, IssueEstimationStatus } from './entities/session-issue.entity'
import { EstimationVote } from './entities/estimation-vote.entity'
import { Issue } from '../issues/entities/issue.entity'
import { User } from '../users/entities/user.entity'

interface CreateSessionRequest {
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

interface VoteRequest {
  estimate: number
  estimateText: string
  rationale?: string
}

@Injectable()
export class EstimationService {
  constructor(
    @InjectRepository(EstimationSession)
    private sessionRepository: Repository<EstimationSession>,
    @InjectRepository(EstimationParticipant)
    private participantRepository: Repository<EstimationParticipant>,
    @InjectRepository(SessionIssue)
    private sessionIssueRepository: Repository<SessionIssue>,
    @InjectRepository(EstimationVote)
    private voteRepository: Repository<EstimationVote>,
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Create estimation session
  async createSession(data: CreateSessionRequest): Promise<EstimationSession> {
    // Validate issues exist
    const issues = await this.issueRepository.find({
      where: { id: In(data.issueIds) }
    })

    if (issues.length !== data.issueIds.length) {
      throw new BadRequestException('Some issues not found')
    }

    // Create session
    const session = this.sessionRepository.create({
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      sprintId: data.sprintId,
      facilitatorId: data.facilitatorId,
      estimationScale: data.estimationScale || EstimationScale.FIBONACCI,
      anonymousVoting: data.anonymousVoting || false,
      discussionTimeLimit: data.discussionTimeLimit || 120,
      autoReveal: data.autoReveal || true,
      status: SessionStatus.CREATED,
    })

    const savedSession = await this.sessionRepository.save(session)

    // Create session issues
    const sessionIssues = data.issueIds.map((issueId, index) =>
      this.sessionIssueRepository.create({
        sessionId: savedSession.id,
        issueId,
        position: index,
        status: IssueEstimationStatus.PENDING,
        votingRound: 1,
      })
    )

    await this.sessionIssueRepository.save(sessionIssues)

    // Add facilitator as participant
    await this.addParticipant(savedSession.id, data.facilitatorId)

    return this.getSession(savedSession.id)
  }

  // Get session with full details
  async getSession(sessionId: number): Promise<EstimationSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: [
        'facilitator',
        'project',
        'sprint',
        'participants',
        'participants.user',
        'sessionIssues',
        'sessionIssues.issue',
        'sessionIssues.votes',
        'sessionIssues.votes.voter',
      ],
    })

    if (!session) {
      throw new NotFoundException('Session not found')
    }

    return session
  }

  // Get sessions by project
  async getSessionsByProject(projectId: number): Promise<EstimationSession[]> {
    return this.sessionRepository.find({
      where: { projectId },
      relations: ['facilitator', 'participants', 'participants.user'],
      order: { createdAt: 'DESC' },
    })
  }

  // Add participant to session
  async addParticipant(sessionId: number, userId: number): Promise<EstimationParticipant> {
    // Check if already a participant
    const existing = await this.participantRepository.findOne({
      where: { sessionId, userId }
    })

    if (existing) {
      // Rejoin if previously left
      if (existing.status === ParticipantStatus.LEFT) {
        existing.status = ParticipantStatus.JOINED
        existing.isOnline = true
        return this.participantRepository.save(existing)
      }
      return existing
    }

    const participant = this.participantRepository.create({
      sessionId,
      userId,
      status: ParticipantStatus.JOINED,
      isOnline: true,
    })

    return this.participantRepository.save(participant)
  }

  // Start estimation session
  async startSession(sessionId: number, facilitatorId: number): Promise<EstimationSession> {
    const session = await this.getSession(sessionId)

    if (session.facilitatorId !== facilitatorId) {
      throw new BadRequestException('Only facilitator can start session')
    }

    if (session.status !== SessionStatus.CREATED) {
      throw new BadRequestException('Session already started')
    }

    // Set first issue as current
    const firstIssue = session.sessionIssues.find(si => si.position === 0)

    session.status = SessionStatus.WAITING
    session.currentIssueId = firstIssue?.issueId || null

    return this.sessionRepository.save(session)
  }

  // Start voting on current issue
  async startVoting(sessionId: number, facilitatorId: number): Promise<SessionIssue> {
    const session = await this.getSession(sessionId)

    if (session.facilitatorId !== facilitatorId) {
      throw new BadRequestException('Only facilitator can start voting')
    }

    if (!session.currentIssueId) {
      throw new BadRequestException('No current issue set')
    }

    const sessionIssue = session.sessionIssues.find(si => si.issueId === session.currentIssueId)
    if (!sessionIssue) {
      throw new NotFoundException('Current issue not found in session')
    }

    sessionIssue.status = IssueEstimationStatus.VOTING
    await this.sessionIssueRepository.save(sessionIssue)

    // Update session status
    session.status = SessionStatus.VOTING
    await this.sessionRepository.save(session)

    return sessionIssue
  }

  // Submit vote
  async submitVote(
    sessionId: number,
    issueId: number,
    voterId: number,
    voteData: VoteRequest
  ): Promise<EstimationVote> {
    const session = await this.getSession(sessionId)
    const sessionIssue = session.sessionIssues.find(si => si.issueId === issueId)

    if (!sessionIssue) {
      throw new NotFoundException('Issue not found in session')
    }

    if (sessionIssue.status !== IssueEstimationStatus.VOTING) {
      throw new BadRequestException('Voting not active for this issue')
    }

    // Check if participant
    const participant = session.participants.find(p => p.userId === voterId)
    if (!participant) {
      throw new BadRequestException('User not a participant in this session')
    }

    // Remove existing vote for this round
    await this.voteRepository.delete({
      sessionIssueId: sessionIssue.id,
      voterId,
      round: sessionIssue.votingRound,
    })

    // Create new vote
    const vote = this.voteRepository.create({
      sessionIssueId: sessionIssue.id,
      voterId,
      estimate: voteData.estimate,
      estimateText: voteData.estimateText,
      rationale: voteData.rationale,
      round: sessionIssue.votingRound,
      isRevealed: false,
    })

    const savedVote = await this.voteRepository.save(vote)

    // Check if all participants have voted
    const allVotes = await this.voteRepository.count({
      where: {
        sessionIssueId: sessionIssue.id,
        round: sessionIssue.votingRound,
      }
    })

    const activeParticipants = session.participants.filter(p =>
      p.status === ParticipantStatus.JOINED && p.isOnline
    ).length

    // Auto-reveal if all voted and auto-reveal is enabled
    if (allVotes >= activeParticipants && session.autoReveal) {
      await this.revealVotes(sessionId, issueId, session.facilitatorId)
    }

    return savedVote
  }

  // Reveal votes
  async revealVotes(sessionId: number, issueId: number, facilitatorId: number): Promise<EstimationVote[]> {
    const session = await this.getSession(sessionId)

    if (session.facilitatorId !== facilitatorId) {
      throw new BadRequestException('Only facilitator can reveal votes')
    }

    const sessionIssue = session.sessionIssues.find(si => si.issueId === issueId)
    if (!sessionIssue) {
      throw new NotFoundException('Issue not found in session')
    }

    // Mark all votes as revealed
    await this.voteRepository.update(
      {
        sessionIssueId: sessionIssue.id,
        round: sessionIssue.votingRound,
        isRevealed: false,
      },
      { isRevealed: true }
    )

    // Update session issue status
    sessionIssue.status = IssueEstimationStatus.DISCUSSING
    await this.sessionIssueRepository.save(sessionIssue)

    // Update session status
    session.status = SessionStatus.DISCUSSING
    await this.sessionRepository.save(session)

    // Return revealed votes
    return this.voteRepository.find({
      where: {
        sessionIssueId: sessionIssue.id,
        round: sessionIssue.votingRound,
      },
      relations: ['voter'],
    })
  }

  // Finalize estimate for issue
  async finalizeEstimate(
    sessionId: number,
    issueId: number,
    facilitatorId: number,
    finalEstimate: number
  ): Promise<SessionIssue> {
    const session = await this.getSession(sessionId)

    if (session.facilitatorId !== facilitatorId) {
      throw new BadRequestException('Only facilitator can finalize estimate')
    }

    const sessionIssue = session.sessionIssues.find(si => si.issueId === issueId)
    if (!sessionIssue) {
      throw new NotFoundException('Issue not found in session')
    }

    // Update session issue
    sessionIssue.status = IssueEstimationStatus.ESTIMATED
    sessionIssue.finalEstimate = finalEstimate
    sessionIssue.hasConsensus = true

    await this.sessionIssueRepository.save(sessionIssue)

    // Update the actual issue estimate
    await this.issueRepository.update(issueId, { estimate: finalEstimate })

    return sessionIssue
  }

  // Move to next issue
  async moveToNextIssue(sessionId: number, facilitatorId: number): Promise<SessionIssue | null> {
    const session = await this.getSession(sessionId)

    if (session.facilitatorId !== facilitatorId) {
      throw new BadRequestException('Only facilitator can move to next issue')
    }

    const sessionIssues = session.sessionIssues.sort((a, b) => a.position - b.position)
    const currentIndex = sessionIssues.findIndex(si => si.issueId === session.currentIssueId)
    const nextIssue = sessionIssues[currentIndex + 1]

    if (!nextIssue) {
      // No more issues, complete session
      session.status = SessionStatus.COMPLETED
      session.currentIssueId = null
      await this.sessionRepository.save(session)
      return null
    }

    // Set next issue as current
    session.currentIssueId = nextIssue.issueId
    session.status = SessionStatus.WAITING
    await this.sessionRepository.save(session)

    // Reset next issue status
    nextIssue.status = IssueEstimationStatus.PENDING
    nextIssue.votingRound = 1
    await this.sessionIssueRepository.save(nextIssue)

    return nextIssue
  }

  // Start new voting round
  async startNewRound(sessionId: number, issueId: number, facilitatorId: number): Promise<SessionIssue> {
    const session = await this.getSession(sessionId)

    if (session.facilitatorId !== facilitatorId) {
      throw new BadRequestException('Only facilitator can start new round')
    }

    const sessionIssue = session.sessionIssues.find(si => si.issueId === issueId)
    if (!sessionIssue) {
      throw new NotFoundException('Issue not found in session')
    }

    // Increment round and reset status
    sessionIssue.votingRound += 1
    sessionIssue.status = IssueEstimationStatus.VOTING

    await this.sessionIssueRepository.save(sessionIssue)

    // Update session status
    session.status = SessionStatus.VOTING
    await this.sessionRepository.save(session)

    return sessionIssue
  }

  // Get estimation scales
  getEstimationScales(): Record<EstimationScale, string[]> {
    return {
      [EstimationScale.FIBONACCI]: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '?', '☕'],
      [EstimationScale.TSHIRT]: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'],
      [EstimationScale.HOURS]: ['0.5', '1', '2', '4', '8', '16', '24', '?'],
      [EstimationScale.DAYS]: ['0.5', '1', '2', '3', '5', '10', '20', '?'],
      [EstimationScale.POWER_OF_2]: ['1', '2', '4', '8', '16', '32', '?'],
      [EstimationScale.LINEAR]: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      [EstimationScale.MODIFIED_FIBONACCI]: ['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40', '?'],
      [EstimationScale.STORY_POINTS]: ['1', '2', '3', '5', '8', '13', '21', '?'],
    }
  }

  // Get vote statistics
  async getVoteStatistics(sessionIssueId: number, round: number): Promise<any> {
    const votes = await this.voteRepository.find({
      where: { sessionIssueId, round },
      relations: ['voter'],
    })

    const estimates = votes.map(v => v.estimate).filter(e => !isNaN(e))
    const average = estimates.length > 0 ? estimates.reduce((a, b) => a + b, 0) / estimates.length : 0
    const min = estimates.length > 0 ? Math.min(...estimates) : 0
    const max = estimates.length > 0 ? Math.max(...estimates) : 0

    // Calculate consensus (within 1 point of each other)
    const hasConsensus = estimates.length > 0 && (max - min) <= 1

    return {
      totalVotes: votes.length,
      averageEstimate: average,
      minEstimate: min,
      maxEstimate: max,
      hasConsensus,
      votes: votes.map(v => ({
        voter: v.voter.name,
        estimate: v.estimate,
        estimateText: v.estimateText,
        rationale: v.rationale,
        isRevealed: v.isRevealed,
      })),
    }
  }
}