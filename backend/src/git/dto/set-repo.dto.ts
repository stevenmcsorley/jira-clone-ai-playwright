import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

export class SetRepoDto {
  @IsIn(['github'])
  provider: string

  @IsString()
  @MaxLength(255)
  owner: string

  @IsString()
  @MaxLength(255)
  repo: string

  /** Omit on update to keep the existing token. Empty string = public read. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  token?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultBranch?: string
}
