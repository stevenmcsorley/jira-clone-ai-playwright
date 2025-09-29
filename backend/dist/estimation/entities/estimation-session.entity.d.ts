import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Sprint } from '../../sprints/entities/sprint.entity';
import { EstimationParticipant } from './estimation-participant.entity';
import { SessionIssue } from './session-issue.entity';
export declare enum EstimationScale {
    FIBONACCI = "fibonacci",
    TSHIRT = "tshirt",
    HOURS = "hours",
    DAYS = "days",
    POWER_OF_2 = "power_of_2",
    LINEAR = "linear",
    MODIFIED_FIBONACCI = "modified_fibonacci",
    STORY_POINTS = "story_points"
}
export declare enum SessionStatus {
    CREATED = "created",
    WAITING = "waiting",
    VOTING = "voting",
    DISCUSSING = "discussing",
    COMPLETED = "completed"
}
export declare class EstimationSession {
    id: number;
    name: string;
    description: string;
    status: SessionStatus;
    estimationScale: EstimationScale;
    anonymousVoting: boolean;
    discussionTimeLimit: number;
    autoReveal: boolean;
    currentIssueId: number;
    facilitatorId: number;
    facilitator: User;
    projectId: number;
    project: Project;
    sprintId: number;
    sprint: Sprint;
    participants: EstimationParticipant[];
    sessionIssues: SessionIssue[];
    createdAt: Date;
    updatedAt: Date;
}
