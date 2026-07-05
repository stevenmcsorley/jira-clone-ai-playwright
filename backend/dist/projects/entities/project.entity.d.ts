import { User } from '../../users/entities/user.entity';
import { Issue } from '../../issues/entities/issue.entity';
import { Sprint } from '../../sprints/entities/sprint.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
export declare class Project {
    id: number;
    name: string;
    key: string;
    description: string;
    workspaceId: number;
    workspace: Workspace;
    leadId: number;
    lead: User;
    issues: Issue[];
    sprints: Sprint[];
    createdAt: Date;
    updatedAt: Date;
}
