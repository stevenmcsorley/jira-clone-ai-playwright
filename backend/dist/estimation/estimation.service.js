"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const estimation_session_entity_1 = require("./entities/estimation-session.entity");
const estimation_participant_entity_1 = require("./entities/estimation-participant.entity");
const session_issue_entity_1 = require("./entities/session-issue.entity");
const estimation_vote_entity_1 = require("./entities/estimation-vote.entity");
const issue_entity_1 = require("../issues/entities/issue.entity");
const user_entity_1 = require("../users/entities/user.entity");
let EstimationService = class EstimationService {
    constructor(sessionRepository, participantRepository, sessionIssueRepository, voteRepository, issueRepository, userRepository) {
        this.sessionRepository = sessionRepository;
        this.participantRepository = participantRepository;
        this.sessionIssueRepository = sessionIssueRepository;
        this.voteRepository = voteRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }
    async createSession(data) {
        const issues = await this.issueRepository.find({
            where: { id: (0, typeorm_2.In)(data.issueIds) }
        });
        if (issues.length !== data.issueIds.length) {
            throw new common_1.BadRequestException('Some issues not found');
        }
        const session = this.sessionRepository.create({
            name: data.name,
            description: data.description,
            projectId: data.projectId,
            sprintId: data.sprintId,
            facilitatorId: data.facilitatorId,
            estimationScale: data.estimationScale || estimation_session_entity_1.EstimationScale.FIBONACCI,
            anonymousVoting: data.anonymousVoting || false,
            discussionTimeLimit: data.discussionTimeLimit || 120,
            autoReveal: data.autoReveal || true,
            status: estimation_session_entity_1.SessionStatus.CREATED,
        });
        const savedSession = await this.sessionRepository.save(session);
        const sessionIssues = data.issueIds.map((issueId, index) => this.sessionIssueRepository.create({
            sessionId: savedSession.id,
            issueId,
            position: index,
            status: session_issue_entity_1.IssueEstimationStatus.PENDING,
            votingRound: 1,
        }));
        await this.sessionIssueRepository.save(sessionIssues);
        await this.addParticipant(savedSession.id, data.facilitatorId);
        return this.getSession(savedSession.id);
    }
    async getSession(sessionId) {
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
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        return session;
    }
    async getSessionsByProject(projectId) {
        return this.sessionRepository.find({
            where: { projectId },
            relations: ['facilitator', 'participants', 'participants.user'],
            order: { createdAt: 'DESC' },
        });
    }
    async addParticipant(sessionId, userId) {
        const existing = await this.participantRepository.findOne({
            where: { sessionId, userId }
        });
        if (existing) {
            if (existing.status === estimation_participant_entity_1.ParticipantStatus.LEFT) {
                existing.status = estimation_participant_entity_1.ParticipantStatus.JOINED;
                existing.isOnline = true;
                return this.participantRepository.save(existing);
            }
            return existing;
        }
        const participant = this.participantRepository.create({
            sessionId,
            userId,
            status: estimation_participant_entity_1.ParticipantStatus.JOINED,
            isOnline: true,
        });
        return this.participantRepository.save(participant);
    }
    async startSession(sessionId, facilitatorId) {
        const session = await this.getSession(sessionId);
        if (session.facilitatorId !== facilitatorId) {
            throw new common_1.BadRequestException('Only facilitator can start session');
        }
        if (session.status !== estimation_session_entity_1.SessionStatus.CREATED) {
            throw new common_1.BadRequestException('Session already started');
        }
        const firstIssue = session.sessionIssues.find(si => si.position === 0);
        session.status = estimation_session_entity_1.SessionStatus.WAITING;
        session.currentIssueId = firstIssue?.issueId || null;
        return this.sessionRepository.save(session);
    }
    async startVoting(sessionId, facilitatorId) {
        const session = await this.getSession(sessionId);
        if (session.facilitatorId !== facilitatorId) {
            throw new common_1.BadRequestException('Only facilitator can start voting');
        }
        if (!session.currentIssueId) {
            throw new common_1.BadRequestException('No current issue set');
        }
        const sessionIssue = session.sessionIssues.find(si => si.issueId === session.currentIssueId);
        if (!sessionIssue) {
            throw new common_1.NotFoundException('Current issue not found in session');
        }
        sessionIssue.status = session_issue_entity_1.IssueEstimationStatus.VOTING;
        await this.sessionIssueRepository.save(sessionIssue);
        session.status = estimation_session_entity_1.SessionStatus.VOTING;
        await this.sessionRepository.save(session);
        return sessionIssue;
    }
    async submitVote(sessionId, issueId, voterId, voteData) {
        const session = await this.getSession(sessionId);
        const sessionIssue = session.sessionIssues.find(si => si.issueId === issueId);
        if (!sessionIssue) {
            throw new common_1.NotFoundException('Issue not found in session');
        }
        if (sessionIssue.status !== session_issue_entity_1.IssueEstimationStatus.VOTING) {
            throw new common_1.BadRequestException('Voting not active for this issue');
        }
        const participant = session.participants.find(p => p.userId === voterId);
        if (!participant) {
            throw new common_1.BadRequestException('User not a participant in this session');
        }
        await this.voteRepository.delete({
            sessionIssueId: sessionIssue.id,
            voterId,
            round: sessionIssue.votingRound,
        });
        const vote = this.voteRepository.create({
            sessionIssueId: sessionIssue.id,
            voterId,
            estimate: voteData.estimate,
            estimateText: voteData.estimateText,
            rationale: voteData.rationale,
            round: sessionIssue.votingRound,
            isRevealed: false,
        });
        const savedVote = await this.voteRepository.save(vote);
        const allVotes = await this.voteRepository.count({
            where: {
                sessionIssueId: sessionIssue.id,
                round: sessionIssue.votingRound,
            }
        });
        const activeParticipants = session.participants.filter(p => p.status === estimation_participant_entity_1.ParticipantStatus.JOINED && p.isOnline).length;
        if (allVotes >= activeParticipants && session.autoReveal) {
            await this.revealVotes(sessionId, issueId, session.facilitatorId);
        }
        return savedVote;
    }
    async revealVotes(sessionId, issueId, facilitatorId) {
        const session = await this.getSession(sessionId);
        if (session.facilitatorId !== facilitatorId) {
            throw new common_1.BadRequestException('Only facilitator can reveal votes');
        }
        const sessionIssue = session.sessionIssues.find(si => si.issueId === issueId);
        if (!sessionIssue) {
            throw new common_1.NotFoundException('Issue not found in session');
        }
        await this.voteRepository.update({
            sessionIssueId: sessionIssue.id,
            round: sessionIssue.votingRound,
            isRevealed: false,
        }, { isRevealed: true });
        sessionIssue.status = session_issue_entity_1.IssueEstimationStatus.DISCUSSING;
        await this.sessionIssueRepository.save(sessionIssue);
        session.status = estimation_session_entity_1.SessionStatus.DISCUSSING;
        await this.sessionRepository.save(session);
        return this.voteRepository.find({
            where: {
                sessionIssueId: sessionIssue.id,
                round: sessionIssue.votingRound,
            },
            relations: ['voter'],
        });
    }
    async finalizeEstimate(sessionId, issueId, facilitatorId, finalEstimate) {
        const session = await this.getSession(sessionId);
        if (session.facilitatorId !== facilitatorId) {
            throw new common_1.BadRequestException('Only facilitator can finalize estimate');
        }
        const sessionIssue = session.sessionIssues.find(si => si.issueId === issueId);
        if (!sessionIssue) {
            throw new common_1.NotFoundException('Issue not found in session');
        }
        sessionIssue.status = session_issue_entity_1.IssueEstimationStatus.ESTIMATED;
        sessionIssue.finalEstimate = finalEstimate;
        sessionIssue.hasConsensus = true;
        await this.sessionIssueRepository.save(sessionIssue);
        await this.issueRepository.update(issueId, { estimate: finalEstimate });
        return sessionIssue;
    }
    async moveToNextIssue(sessionId, facilitatorId) {
        const session = await this.getSession(sessionId);
        if (session.facilitatorId !== facilitatorId) {
            throw new common_1.BadRequestException('Only facilitator can move to next issue');
        }
        const sessionIssues = session.sessionIssues.sort((a, b) => a.position - b.position);
        const currentIndex = sessionIssues.findIndex(si => si.issueId === session.currentIssueId);
        const nextIssue = sessionIssues[currentIndex + 1];
        if (!nextIssue) {
            session.status = estimation_session_entity_1.SessionStatus.COMPLETED;
            session.currentIssueId = null;
            await this.sessionRepository.save(session);
            return null;
        }
        session.currentIssueId = nextIssue.issueId;
        session.status = estimation_session_entity_1.SessionStatus.WAITING;
        await this.sessionRepository.save(session);
        nextIssue.status = session_issue_entity_1.IssueEstimationStatus.PENDING;
        nextIssue.votingRound = 1;
        await this.sessionIssueRepository.save(nextIssue);
        return nextIssue;
    }
    async startNewRound(sessionId, issueId, facilitatorId) {
        const session = await this.getSession(sessionId);
        if (session.facilitatorId !== facilitatorId) {
            throw new common_1.BadRequestException('Only facilitator can start new round');
        }
        const sessionIssue = session.sessionIssues.find(si => si.issueId === issueId);
        if (!sessionIssue) {
            throw new common_1.NotFoundException('Issue not found in session');
        }
        sessionIssue.votingRound += 1;
        sessionIssue.status = session_issue_entity_1.IssueEstimationStatus.VOTING;
        await this.sessionIssueRepository.save(sessionIssue);
        session.status = estimation_session_entity_1.SessionStatus.VOTING;
        await this.sessionRepository.save(session);
        return sessionIssue;
    }
    getEstimationScales() {
        return {
            [estimation_session_entity_1.EstimationScale.FIBONACCI]: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '?', '☕'],
            [estimation_session_entity_1.EstimationScale.TSHIRT]: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'],
            [estimation_session_entity_1.EstimationScale.HOURS]: ['0.5', '1', '2', '4', '8', '16', '24', '?'],
            [estimation_session_entity_1.EstimationScale.DAYS]: ['0.5', '1', '2', '3', '5', '10', '20', '?'],
            [estimation_session_entity_1.EstimationScale.POWER_OF_2]: ['1', '2', '4', '8', '16', '32', '?'],
            [estimation_session_entity_1.EstimationScale.LINEAR]: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            [estimation_session_entity_1.EstimationScale.MODIFIED_FIBONACCI]: ['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40', '?'],
            [estimation_session_entity_1.EstimationScale.STORY_POINTS]: ['1', '2', '3', '5', '8', '13', '21', '?'],
        };
    }
    async getVoteStatistics(sessionIssueId, round) {
        const votes = await this.voteRepository.find({
            where: { sessionIssueId, round },
            relations: ['voter'],
        });
        const estimates = votes.map(v => v.estimate).filter(e => !isNaN(e));
        const average = estimates.length > 0 ? estimates.reduce((a, b) => a + b, 0) / estimates.length : 0;
        const min = estimates.length > 0 ? Math.min(...estimates) : 0;
        const max = estimates.length > 0 ? Math.max(...estimates) : 0;
        const hasConsensus = estimates.length > 0 && (max - min) <= 1;
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
        };
    }
};
exports.EstimationService = EstimationService;
exports.EstimationService = EstimationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(estimation_session_entity_1.EstimationSession)),
    __param(1, (0, typeorm_1.InjectRepository)(estimation_participant_entity_1.EstimationParticipant)),
    __param(2, (0, typeorm_1.InjectRepository)(session_issue_entity_1.SessionIssue)),
    __param(3, (0, typeorm_1.InjectRepository)(estimation_vote_entity_1.EstimationVote)),
    __param(4, (0, typeorm_1.InjectRepository)(issue_entity_1.Issue)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EstimationService);
//# sourceMappingURL=estimation.service.js.map