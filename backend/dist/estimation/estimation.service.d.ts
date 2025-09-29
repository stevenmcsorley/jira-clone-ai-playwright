import { Repository } from 'typeorm';
import { EstimationSession, EstimationScale } from './entities/estimation-session.entity';
import { EstimationParticipant } from './entities/estimation-participant.entity';
import { SessionIssue } from './entities/session-issue.entity';
import { EstimationVote } from './entities/estimation-vote.entity';
import { Issue } from '../issues/entities/issue.entity';
import { User } from '../users/entities/user.entity';
interface CreateSessionRequest {
    name: string;
    description?: string;
    projectId: number;
    sprintId?: number;
    facilitatorId: number;
    estimationScale?: EstimationScale;
    anonymousVoting?: boolean;
    discussionTimeLimit?: number;
    autoReveal?: boolean;
    issueIds: number[];
}
interface VoteRequest {
    estimate: number;
    estimateText: string;
    rationale?: string;
}
export declare class EstimationService {
    private sessionRepository;
    private participantRepository;
    private sessionIssueRepository;
    private voteRepository;
    private issueRepository;
    private userRepository;
    constructor(sessionRepository: Repository<EstimationSession>, participantRepository: Repository<EstimationParticipant>, sessionIssueRepository: Repository<SessionIssue>, voteRepository: Repository<EstimationVote>, issueRepository: Repository<Issue>, userRepository: Repository<User>);
    createSession(data: CreateSessionRequest): Promise<EstimationSession>;
    getSession(sessionId: number): Promise<EstimationSession>;
    getSessionsByProject(projectId: number): Promise<EstimationSession[]>;
    addParticipant(sessionId: number, userId: number): Promise<EstimationParticipant>;
    startSession(sessionId: number, facilitatorId: number): Promise<EstimationSession>;
    startVoting(sessionId: number, facilitatorId: number): Promise<SessionIssue>;
    submitVote(sessionId: number, issueId: number, voterId: number, voteData: VoteRequest): Promise<EstimationVote>;
    revealVotes(sessionId: number, issueId: number, facilitatorId: number): Promise<EstimationVote[]>;
    finalizeEstimate(sessionId: number, issueId: number, facilitatorId: number, finalEstimate: number): Promise<SessionIssue>;
    moveToNextIssue(sessionId: number, facilitatorId: number): Promise<SessionIssue | null>;
    startNewRound(sessionId: number, issueId: number, facilitatorId: number): Promise<SessionIssue>;
    getEstimationScales(): Record<EstimationScale, string[]>;
    getVoteStatistics(sessionIssueId: number, round: number): Promise<any>;
}
export {};
