import { User } from '../../users/entities/user.entity';
import { SessionIssue } from './session-issue.entity';
export declare class EstimationVote {
    id: number;
    sessionIssueId: number;
    sessionIssue: SessionIssue;
    voterId: number;
    voter: User;
    estimate: number;
    estimateText: string;
    round: number;
    rationale: string;
    isRevealed: boolean;
    createdAt: Date;
    updatedAt: Date;
}
