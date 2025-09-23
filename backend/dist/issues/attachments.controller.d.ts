import { AttachmentsService } from './attachments.service';
import { Response as ExpressResponse } from 'express';
export declare class AttachmentsController {
    private readonly attachmentsService;
    constructor(attachmentsService: AttachmentsService);
    uploadFile(issueId: number, file: Express.Multer.File, req: any): Promise<import("./entities/attachment.entity").Attachment>;
    findByIssue(issueId: number): Promise<import("./entities/attachment.entity").Attachment[]>;
    findOne(id: number): Promise<import("./entities/attachment.entity").Attachment>;
    downloadFile(id: number, res: ExpressResponse): Promise<void>;
    remove(id: number, req: any): Promise<void>;
}
