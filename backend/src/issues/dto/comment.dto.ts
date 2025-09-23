import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator'

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string

  @IsNumber()
  issueId: number

  @IsNumber()
  @IsOptional()
  parentId?: number
}

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  content?: string
}

export class CommentResponseDto {
  id: number
  content: string
  issueId: number
  authorId: number
  parentId?: number
  isEdited: boolean
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
  author: {
    id: number
    name: string
    email: string
    avatar?: string
  }
  replies?: CommentResponseDto[]
}