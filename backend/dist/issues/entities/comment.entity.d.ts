import { User } from '../../users/entities/user.entity';
import { Issue } from './issue.entity';
export declare class Comment {
    id: number;
    content: string;
    author: User;
    authorId: number;
    issue: Issue;
    issueId: number;
    parent?: Comment;
    parentId?: number;
    children: Comment[];
    createdAt: Date;
    updatedAt: Date;
    isEdited: boolean;
    editedAt: Date;
}
