import { IsNumber, IsString, IsNotEmpty } from 'class-validator'

export class CreateAttachmentDto {
  @IsString()
  @IsNotEmpty()
  filename: string

  @IsString()
  @IsNotEmpty()
  originalName: string

  @IsString()
  @IsNotEmpty()
  mimeType: string

  @IsNumber()
  size: number

  @IsString()
  @IsNotEmpty()
  path: string

  @IsNumber()
  issueId: number
}

export class AttachmentResponseDto {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  issueId: number
  uploadedById: number
  createdAt: Date
  uploadedBy: {
    id: number
    name: string
    email: string
  }
}