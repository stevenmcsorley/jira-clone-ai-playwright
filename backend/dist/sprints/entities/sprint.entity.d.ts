import { Project } from '../../projects/entities/project.entity';
import { Issue } from '../../issues/entities/issue.entity';
import { User } from '../../users/entities/user.entity';
export declare enum SprintStatus {
    FUTURE = "future",
    ACTIVE = "active",
    COMPLETED = "completed"
}
export declare class Sprint {
    id: number;
    name: string;
    goal: string;
    status: SprintStatus;
    projectId: number;
    project: Project;
    startDate: Date;
    endDate: Date;
    position: number;
    issues: Issue[];
    createdById: number;
    createdBy: User;
    createdAt: Date;
    updatedAt: Date;
}
