import { EstimationService } from './estimation.service';
import { EstimationScale } from './entities/estimation-session.entity';
interface CreateSessionDto {
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
interface VoteDto {
    estimate: number;
    estimateText: string;
    rationale?: string;
}
interface FinalizeEstimateDto {
    finalEstimate: number;
}
export declare class EstimationController {
    private readonly estimationService;
    constructor(estimationService: EstimationService);
    createSession(createSessionDto: CreateSessionDto): Promise<import("./entities/estimation-session.entity").EstimationSession>;
    getSession(id: number): Promise<import("./entities/estimation-session.entity").EstimationSession>;
    getSessionsByProject(projectId: number): Promise<import("./entities/estimation-session.entity").EstimationSession[]>;
    addParticipant(sessionId: number, userId: number): Promise<import("./entities/estimation-participant.entity").EstimationParticipant>;
    startSession(sessionId: number, facilitatorId: number): Promise<import("./entities/estimation-session.entity").EstimationSession>;
    startVoting(sessionId: number, facilitatorId: number): Promise<import("./entities/session-issue.entity").SessionIssue>;
    submitVote(sessionId: number, issueId: number, voterId: number, voteData: VoteDto): Promise<import("./entities/estimation-vote.entity").EstimationVote>;
    revealVotes(sessionId: number, issueId: number, facilitatorId: number): Promise<import("./entities/estimation-vote.entity").EstimationVote[]>;
    finalizeEstimate(sessionId: number, issueId: number, facilitatorId: number, { finalEstimate }: FinalizeEstimateDto): Promise<import("./entities/session-issue.entity").SessionIssue>;
    moveToNextIssue(sessionId: number, facilitatorId: number): Promise<import("./entities/session-issue.entity").SessionIssue>;
    startNewRound(sessionId: number, issueId: number, facilitatorId: number): Promise<import("./entities/session-issue.entity").SessionIssue>;
    getEstimationScales(): Record<EstimationScale, string[]>;
    getVoteStatistics(sessionId: number, issueId: number, round?: number): Promise<any>;
}
export {};
