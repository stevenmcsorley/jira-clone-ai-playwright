import { Project } from '../../projects/entities/project.entity';
import { Issue } from '../../issues/entities/issue.entity';
import { Comment } from '../../issues/entities/comment.entity';
import { Attachment } from '../../issues/entities/attachment.entity';
import { Subtask } from '../../issues/entities/subtask.entity';
import { TimeLog } from '../../issues/entities/time-log.entity';
export declare class User {
    id: number;
    email: string;
    name: string;
    avatar: string;
    password: string;
    ledProjects: Project[];
    assignedIssues: Issue[];
    reportedIssues: Issue[];
    comments: Comment[];
    attachments: Attachment[];
    assignedSubtasks: Subtask[];
    timeLogs: TimeLog[];
    createdAt: Date;
    updatedAt: Date;
}
