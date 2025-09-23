import { User } from '../../users/entities/user.entity';
import { Issue } from './issue.entity';
export declare class TimeLog {
    id: number;
    hours: number;
    date: Date;
    description: string;
    user: User;
    userId: number;
    issue: Issue;
    issueId: number;
    createdAt: Date;
}
