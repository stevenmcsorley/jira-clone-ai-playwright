import { IsString, IsEnum, IsNumber, IsOptional, IsArray } from 'class-validator'
import { IssueType, IssuePriority } from '../entities/issue.entity'
import { IssueStatus } from '../enums/issue-status.enum'

export class CreateIssueDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority

  @IsEnum(IssueType)
  type: IssueType

  @IsNumber()
  projectId: number

  @IsOptional()
  @IsNumber()
  assigneeId?: number

  @IsNumber()
  reporterId: number

  @IsOptional()
  @IsNumber()
  estimate?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[]

  @IsOptional()
  @IsNumber()
  epicId?: number
}