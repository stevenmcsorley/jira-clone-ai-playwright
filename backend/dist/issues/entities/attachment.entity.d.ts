import { User } from '../../users/entities/user.entity';
import { Issue } from './issue.entity';
export declare class Attachment {
    id: number;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    uploadedBy: User;
    uploadedById: number;
    issue: Issue;
    issueId: number;
    createdAt: Date;
}
