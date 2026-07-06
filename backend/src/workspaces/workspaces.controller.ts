import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Req,
  ForbiddenException, BadRequestException, HttpCode,
} from '@nestjs/common'
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { WorkspacesService } from './workspaces.service'
import { UsersService } from '../users/users.service'
import { ProjectsService } from '../projects/projects.service'
import { Public } from '../auth/decorators/public.decorator'
import { AuthService } from '../auth/services/auth.service'
import { rateLimit } from '../auth/rate-limit'

// A resized 256px icon data URL comfortably fits in ~400k base64 chars; cap generously.
const ICON_IMAGE_MAX = 600_000

class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  icon?: string
}

class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  icon?: string

  @IsOptional()
  @IsString()
  @MaxLength(ICON_IMAGE_MAX)
  iconImage?: string
}

class InviteDto {
  @IsEmail()
  email: string

  @IsIn(['admin', 'member'])
  role: 'admin' | 'member'
}

class AcceptInviteDto {
  // Only needed when the invitee has no account yet
  name?: string
  password?: string
}

const requireManager = (req: any) => {
  if (!['owner', 'admin'].includes(req.workspaceRole)) {
    throw new ForbiddenException('Workspace admin access required')
  }
}

@Controller('api/workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get()
  myWorkspaces(@Req() req: any) {
    return this.workspacesService.findForUser(req.user.id)
  }

  /** The workspace this request (session header / API token binding) resolves to. */
  @Get('current')
  async current(@Req() req: any) {
    const workspaces = await this.workspacesService.findForUser(req.user.id)
    const current = workspaces.find(w => w.id === req.workspaceId)
    return { ...current, role: req.workspaceRole }
  }

  @Post()
  create(@Body() dto: CreateWorkspaceDto, @Req() req: any) {
    return this.workspacesService.createWorkspace(dto.name, req.user.id, dto.icon)
  }

  @Patch('current')
  update(@Body() dto: UpdateWorkspaceDto, @Req() req: any) {
    requireManager(req)
    return this.workspacesService.update(req.workspaceId, dto)
  }

  @Delete('current')
  @HttpCode(204)
  async deleteWorkspace(@Req() req: any) {
    if (req.workspaceRole !== 'owner') {
      throw new ForbiddenException('Only an owner can delete a workspace')
    }
    // Remove projects through the service so all issue children go with them
    const projects = await this.projectsService.findAll(req.workspaceId)
    for (const project of projects) {
      await this.projectsService.remove(project.id, req.workspaceId)
    }
    await this.workspacesService.deleteWorkspace(req.workspaceId)
  }

  @Get('current/members')
  members(@Req() req: any) {
    return this.workspacesService.listMembers(req.workspaceId)
  }

  @Patch('current/members/:memberId')
  changeRole(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body('role') role: 'owner' | 'admin' | 'member',
    @Req() req: any,
  ) {
    requireManager(req)
    if (!['owner', 'admin', 'member'].includes(role)) throw new BadRequestException('Invalid role')
    if (role === 'owner' && req.workspaceRole !== 'owner') {
      throw new ForbiddenException('Only an owner can transfer ownership')
    }
    return this.workspacesService.changeRole(req.workspaceId, memberId, role, req.user.id)
  }

  @Delete('current/members/:memberId')
  @HttpCode(204)
  async removeMember(@Param('memberId', ParseIntPipe) memberId: number, @Req() req: any) {
    requireManager(req)
    await this.workspacesService.removeMember(req.workspaceId, memberId, req.user.id)
  }

  // ---------- invites ----------

  @Post('current/invites')
  invite(@Body() dto: InviteDto, @Req() req: any) {
    requireManager(req)
    return this.workspacesService.createInvite(req.workspaceId, dto.email, dto.role, req.user.id)
  }

  @Get('current/invites')
  invites(@Req() req: any) {
    requireManager(req)
    return this.workspacesService.listInvites(req.workspaceId)
  }

  @Delete('current/invites/:inviteId')
  @HttpCode(204)
  async revokeInvite(@Param('inviteId', ParseIntPipe) inviteId: number, @Req() req: any) {
    requireManager(req)
    await this.workspacesService.revokeInvite(req.workspaceId, inviteId)
  }
}

@Controller('api/invites')
export class InvitesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  /** Public: what an invite link is for, and whether the invitee needs to create an account. */
  @Public()
  @Get(':token')
  async inspect(@Param('token') token: string) {
    const invite = await this.workspacesService.getInviteByToken(token)
    const existingUser = await this.usersService.findByEmail(invite.email)
    return {
      workspaceName: invite.workspace.name,
      email: invite.email,
      role: invite.role,
      accountExists: !!existingUser,
    }
  }

  /**
   * Public: accept an invite. Existing accounts just join; new invitees
   * send name+password to create their account. Returns a session either way.
   */
  @Public()
  @Post(':token/accept')
  @HttpCode(200)
  async accept(@Param('token') token: string, @Body() dto: AcceptInviteDto, @Req() req: any) {
    rateLimit('invite-accept', req.ip)
    const invite = await this.workspacesService.getInviteByToken(token)
    let user = await this.usersService.findByEmail(invite.email)

    if (!user) {
      if (!dto.name || !dto.password) {
        throw new BadRequestException('Name and password are required to create your account')
      }
      if (dto.password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters')
      }
      user = await this.usersService.create({
        email: invite.email,
        name: dto.name,
        password: dto.password,
      })
    }

    await this.workspacesService.acceptInvite(invite, user.id)
    return this.authService.issueSession(user.id)
  }
}
