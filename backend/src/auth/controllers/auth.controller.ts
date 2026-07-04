import { Controller, Post, Get, Body, Req, HttpCode } from '@nestjs/common'
import { IsEmail, IsString, MinLength } from 'class-validator'
import { AuthService } from '../services/auth.service'
import { Public } from '../decorators/public.decorator'

class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(1)
  password: string
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password)
  }

  @Get('me')
  me(@Req() req: any) {
    const { password, ...user } = req.user ?? {}
    return user
  }
}
