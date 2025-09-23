import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
export declare enum IssueStatus {
    TODO = "todo",
    IN_PROGRESS = "in_progress",
    DONE = "done"
}
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
    updatedAt: Date;
}
