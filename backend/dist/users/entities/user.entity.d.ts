import { Project } from '../../projects/entities/project.entity';
import { Issue } from '../../issues/entities/issue.entity';
export declare class User {
    id: number;
    email: string;
    name: string;
    avatar: string;
    password: string;
    ledProjects: Project[];
    assignedIssues: Issue[];
    reportedIssues: Issue[];
    createdAt: Date;
    updatedAt: Date;
}
