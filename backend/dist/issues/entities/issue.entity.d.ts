import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Comment } from './comment.entity';
import { Attachment } from './attachment.entity';
import { Subtask } from './subtask.entity';
import { TimeLog } from './time-log.entity';
import { IssueStatus } from '../enums/issue-status.enum';
export declare enum IssuePriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum IssueType {
    STORY = "story",
    TASK = "task",
    BUG = "bug",
    EPIC = "epic"
}
export declare class Issue {
    id: number;
    title: string;
    description: string;
    status: IssueStatus;
    priority: IssuePriority;
    type: IssueType;
    projectId: number;
    project: Project;
    assigneeId: number;
    assignee: User;
    reporterId: number;
    reporter: User;
    estimate: number;
    labels: string[];
    position: number;
    createdAt: Date;
    comments: Comment[];
    attachments: Attachment[];
    subtasks: Subtask[];
    timeLogs: TimeLog[];
    updatedAt: Date;
}
