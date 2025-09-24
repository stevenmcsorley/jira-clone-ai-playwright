import { User } from '../../users/entities/user.entity';
import { Issue } from '../../issues/entities/issue.entity';
import { Sprint } from '../../sprints/entities/sprint.entity';
export declare class Project {
    id: number;
    name: string;
    key: string;
    description: string;
    leadId: number;
    lead: User;
    issues: Issue[];
    sprints: Sprint[];
    createdAt: Date;
    updatedAt: Date;
}
