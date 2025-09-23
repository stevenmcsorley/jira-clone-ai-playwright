export declare class CreateCommentDto {
    content: string;
    issueId: number;
    parentId?: number;
}
export declare class UpdateCommentDto {
    content?: string;
}
export declare class CommentResponseDto {
    id: number;
    content: string;
    issueId: number;
    authorId: number;
    parentId?: number;
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    author: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    replies?: CommentResponseDto[];
}
