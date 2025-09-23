import { IssueType, IssuePriority, IssueStatus } from '../entities/issue.entity';
export declare class CreateIssueDto {
    title: string;
    description?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    type: IssueType;
    projectId: number;
    assigneeId?: number;
    reporterId: number;
    estimate?: number;
    labels?: string[];
}
