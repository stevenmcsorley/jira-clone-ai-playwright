import { User } from '../../users/entities/user.entity';
import { Issue } from '../../issues/entities/issue.entity';
export declare class Project {
    id: number;
    name: string;
    key: string;
    description: string;
    leadId: number;
    lead: User;
    issues: Issue[];
    createdAt: Date;
    updatedAt: Date;
}
