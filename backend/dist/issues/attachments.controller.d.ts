import { AttachmentsService } from './attachments.service';
import { Response as ExpressResponse } from 'express';
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service';
export declare class AttachmentsController {
    private readonly attachmentsService;
    private readonly workspaceScope;
    constructor(attachmentsService: AttachmentsService, workspaceScope: WorkspaceScopeService);
    uploadFile(issueId: number, file: Express.Multer.File, req: any): Promise<import("./entities/attachment.entity").Attachment>;
    findByIssue(issueId: number, req: any): Promise<import("./entities/attachment.entity").Attachment[]>;
    findOne(id: number, req: any): Promise<import("./entities/attachment.entity").Attachment>;
    downloadFile(id: number, res: ExpressResponse, req: any): Promise<void>;
    remove(id: number, req: any): Promise<void>;
}
