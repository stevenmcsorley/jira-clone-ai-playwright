import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(2)
  name: string

  @IsString()
  @MinLength(6)
  password: string

  @IsOptional()
  @IsString()
  avatar?: string

  @IsOptional()
  @IsIn(['admin', 'member'])
  role?: 'admin' | 'member'
}
