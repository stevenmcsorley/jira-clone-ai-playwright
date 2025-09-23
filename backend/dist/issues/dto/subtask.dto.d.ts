import { IssueStatus } from '../enums/issue-status.enum';
export declare class CreateSubtaskDto {
    title: string;
    description?: string;
    issueId: number;
    assigneeId?: number;
    estimate?: number;
}
export declare class UpdateSubtaskDto {
    title?: string;
    description?: string;
    status?: IssueStatus;
    assigneeId?: number;
    estimate?: number;
    position?: number;
}
export declare class SubtaskResponseDto {
    id: number;
    title: string;
    description?: string;
    status: IssueStatus;
    issueId: number;
    assigneeId?: number;
    estimate?: number;
    position: number;
    createdAt: Date;
    updatedAt: Date;
    assignee?: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
}
