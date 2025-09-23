import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    create(createCommentDto: CreateCommentDto, req: any): Promise<import("./entities/comment.entity").Comment>;
    findByIssue(issueId: number): Promise<import("./entities/comment.entity").Comment[]>;
    findOne(id: number): Promise<import("./entities/comment.entity").Comment>;
    update(id: number, updateCommentDto: UpdateCommentDto, req: any): Promise<import("./entities/comment.entity").Comment>;
    remove(id: number, req: any): Promise<void>;
}
