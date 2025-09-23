export declare class CreateAttachmentDto {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    issueId: number;
}
export declare class AttachmentResponseDto {
    id: number;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    issueId: number;
    uploadedById: number;
    createdAt: Date;
    uploadedBy: {
        id: number;
        name: string;
        email: string;
    };
}
