import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { Issue } from './entities/issue.entity';
import { User } from '../users/entities/user.entity';
import { CreateAttachmentDto } from './dto/attachment.dto';
export declare class AttachmentsService {
    private attachmentsRepository;
    private issuesRepository;
    private usersRepository;
    constructor(attachmentsRepository: Repository<Attachment>, issuesRepository: Repository<Issue>, usersRepository: Repository<User>);
    create(createAttachmentDto: CreateAttachmentDto, uploadedById: number): Promise<Attachment>;
    findByIssue(issueId: number): Promise<Attachment[]>;
    findOne(id: number): Promise<Attachment>;
    remove(id: number, userId: number): Promise<void>;
    formatFileSize(bytes: number): string;
    isImageFile(mimeType: string): boolean;
    getFileIcon(mimeType: string): string;
}
