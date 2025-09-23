import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator'
import { IssueStatus } from '../enums/issue-status.enum'

export class CreateSubtaskDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  issueId: number

  @IsNumber()
  @IsOptional()
  assigneeId?: number

  @IsNumber()
  @IsOptional()
  estimate?: number
}

export class UpdateSubtaskDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus

  @IsNumber()
  @IsOptional()
  assigneeId?: number

  @IsNumber()
  @IsOptional()
  estimate?: number

  @IsNumber()
  @IsOptional()
  position?: number
}

export class SubtaskResponseDto {
  id: number
  title: string
  description?: string
  status: IssueStatus
  issueId: number
  assigneeId?: number
  estimate?: number
  position: number
  createdAt: Date
  updatedAt: Date
  assignee?: {
    id: number
    name: string
    email: string
    avatar?: string
  }
}