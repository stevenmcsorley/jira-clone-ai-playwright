import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service';
export declare class CommentsController {
    private readonly commentsService;
    private readonly workspaceScope;
    constructor(commentsService: CommentsService, workspaceScope: WorkspaceScopeService);
    create(createCommentDto: CreateCommentDto, req: any): Promise<import("./entities/comment.entity").Comment>;
    findByIssue(issueId: number, req: any): Promise<import("./entities/comment.entity").Comment[]>;
    findOne(id: number, req: any): Promise<import("./entities/comment.entity").Comment>;
    update(id: number, updateCommentDto: UpdateCommentDto, req: any): Promise<import("./entities/comment.entity").Comment>;
    remove(id: number, req: any): Promise<void>;
}
