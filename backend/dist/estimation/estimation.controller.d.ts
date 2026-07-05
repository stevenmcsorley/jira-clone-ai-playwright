import { EstimationService } from './estimation.service';
import { EstimationScale } from './entities/estimation-session.entity';
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service';
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
    private readonly workspaceScope;
    constructor(estimationService: EstimationService, workspaceScope: WorkspaceScopeService);
    private assertSession;
    createSession(createSessionDto: CreateSessionDto, req: any): Promise<import("./entities/estimation-session.entity").EstimationSession>;
    getSession(id: number, req: any): Promise<import("./entities/estimation-session.entity").EstimationSession>;
    getSessionsByProject(projectId: number, req: any): Promise<import("./entities/estimation-session.entity").EstimationSession[]>;
    addParticipant(sessionId: number, userId: number, req: any): Promise<import("./entities/estimation-participant.entity").EstimationParticipant>;
    startSession(sessionId: number, facilitatorId: number, req: any): Promise<import("./entities/estimation-session.entity").EstimationSession>;
    startVoting(sessionId: number, facilitatorId: number, req: any): Promise<import("./entities/session-issue.entity").SessionIssue>;
    submitVote(sessionId: number, issueId: number, voterId: number, voteData: VoteDto, req: any): Promise<import("./entities/estimation-vote.entity").EstimationVote>;
    revealVotes(sessionId: number, issueId: number, facilitatorId: number, req: any): Promise<import("./entities/estimation-vote.entity").EstimationVote[]>;
    finalizeEstimate(sessionId: number, issueId: number, facilitatorId: number, { finalEstimate }: FinalizeEstimateDto, req: any): Promise<import("./entities/session-issue.entity").SessionIssue>;
    moveToNextIssue(sessionId: number, facilitatorId: number, req: any): Promise<import("./entities/session-issue.entity").SessionIssue>;
    startNewRound(sessionId: number, issueId: number, facilitatorId: number, req: any): Promise<import("./entities/session-issue.entity").SessionIssue>;
    getEstimationScales(): Record<EstimationScale, string[]>;
    getVoteStatistics(sessionId: number, issueId: number, req: any, round?: number): Promise<any>;
}
export {};
