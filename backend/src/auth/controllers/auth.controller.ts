import { Controller, Post, Get, Body, Req, HttpCode } from '@nestjs/common'
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { AuthService } from '../services/auth.service'
import { Public } from '../decorators/public.decorator'
import { rateLimit } from '../rate-limit'

class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(1)
  password: string
}

class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(2)
  name: string

  @IsString()
  @MinLength(6)
  password: string

  // Optional: names the workspace created on signup. Falls back to "<name>'s workspace".
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  workspaceName?: string
}

class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string

  @IsString()
  @MinLength(6)
  newPassword: string
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: any) {
    rateLimit('login', req.ip)
    return this.authService.login(dto.email, dto.password)
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: any) {
    rateLimit('register', req.ip, 5)
    return this.authService.register(dto.email, dto.name, dto.password, dto.workspaceName)
  }

  /** Public instance config so the SPA knows whether to offer sign-up / uploads. */
  @Public()
  @Get('config')
  config() {
    return {
      openSignup: AuthService.openSignup,
      uploadsEnabled: process.env.UPLOADS_ENABLED === 'true',
    }
  }

  @Get('me')
  me(@Req() req: any) {
    const { password, ...user } = req.user ?? {}
    return user
  }

  @Post('change-password')
  @HttpCode(200)
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: any) {
    rateLimit('change-password', req.ip)
    return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword)
  }
}
