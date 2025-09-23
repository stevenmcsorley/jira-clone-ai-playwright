import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Issue } from './entities/issue.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
export declare class CommentsService {
    private commentsRepository;
    private issuesRepository;
    private usersRepository;
    constructor(commentsRepository: Repository<Comment>, issuesRepository: Repository<Issue>, usersRepository: Repository<User>);
    create(createCommentDto: CreateCommentDto, authorId: number): Promise<Comment>;
    findByIssue(issueId: number): Promise<Comment[]>;
    findOne(id: number): Promise<Comment>;
    update(id: number, updateCommentDto: UpdateCommentDto, userId: number): Promise<Comment>;
    remove(id: number, userId: number): Promise<void>;
}
