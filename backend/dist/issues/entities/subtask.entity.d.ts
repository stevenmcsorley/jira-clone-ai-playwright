import { User } from '../../users/entities/user.entity';
import { Issue } from './issue.entity';
import { IssueStatus } from '../enums/issue-status.enum';
export declare class Subtask {
    id: number;
    title: string;
    completed: boolean;
    issue: Issue;
    issueId: number;
    assignee?: User;
    assigneeId?: number;
    position: number;
    status: IssueStatus;
}
