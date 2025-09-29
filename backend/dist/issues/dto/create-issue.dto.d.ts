import { IssueType, IssuePriority } from '../entities/issue.entity';
import { IssueStatus } from '../enums/issue-status.enum';
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
    storyPoints?: string | number;
    labels?: string[];
    epicId?: number;
}
