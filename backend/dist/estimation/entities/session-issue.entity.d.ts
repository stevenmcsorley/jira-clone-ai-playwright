import { Issue } from '../../issues/entities/issue.entity';
import { EstimationSession } from './estimation-session.entity';
import { EstimationVote } from './estimation-vote.entity';
export declare enum IssueEstimationStatus {
    PENDING = "pending",
    VOTING = "voting",
    DISCUSSING = "discussing",
    ESTIMATED = "estimated",
    SKIPPED = "skipped"
}
export declare class SessionIssue {
    id: number;
    sessionId: number;
    session: EstimationSession;
    issueId: number;
    issue: Issue;
    status: IssueEstimationStatus;
    position: number;
    finalEstimate: number;
    hasConsensus: boolean;
    votingRound: number;
    discussionNotes: string;
    votes: EstimationVote[];
    createdAt: Date;
    updatedAt: Date;
}
