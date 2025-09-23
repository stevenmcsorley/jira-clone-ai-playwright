import { Issue } from './issue.entity';
import { User } from '../../users/entities/user.entity';
export declare enum IssueLinkType {
    BLOCKS = "blocks",
    BLOCKED_BY = "blocked_by",
    DUPLICATES = "duplicates",
    DUPLICATED_BY = "duplicated_by",
    RELATES_TO = "relates_to",
    CAUSES = "causes",
    CAUSED_BY = "caused_by",
    CLONES = "clones",
    CLONED_BY = "cloned_by",
    CHILD_OF = "child_of",
    PARENT_OF = "parent_of"
}
export declare class IssueLink {
    id: number;
    sourceIssueId: number;
    sourceIssue: Issue;
    targetIssueId: number;
    targetIssue: Issue;
    linkType: IssueLinkType;
    createdById: number;
    createdBy: User;
    createdAt: Date;
}
