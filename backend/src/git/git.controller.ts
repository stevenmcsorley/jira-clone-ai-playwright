import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Query,
  Req,
} from '@nestjs/common'
import { GitService } from './git.service'
import { SetRepoDto } from './dto/set-repo.dto'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

@Controller('api/projects/:projectId/repo')
export class GitController {
  constructor(
    private readonly gitService: GitService,
    private readonly scope: WorkspaceScopeService,
  ) {}

  private async assert(projectId: string, req: any): Promise<number> {
    const id = +projectId
    await this.scope.assertProject(id, req.workspaceId)
    return id
  }

  private requireManager(req: any): void {
    if (!['owner', 'admin'].includes(req.workspaceRole)) {
      throw new ForbiddenException('Workspace admin access required')
    }
  }

  /**
   * Turn a provider/network error into a clean 4xx/5xx instead of a raw 500.
   * Config errors (bad token, missing repo) are the caller's fault → 400;
   * everything else is treated as an upstream failure → 502.
   */
  private wrap(err: unknown): never {
    if (err instanceof NotFoundException) throw err
    const message = err instanceof Error ? err.message : 'Git provider error'
    if (/401|403|404|token|forbidden|not found|unsupported/i.test(message)) {
      throw new BadRequestException(message)
    }
    throw new BadGatewayException(message)
  }

  @Get()
  async getConfig(@Param('projectId') projectId: string, @Req() req: any) {
    const id = await this.assert(projectId, req)
    const config = await this.gitService.getConfig(id)
    return config ?? { connected: false }
  }

  @Put()
  async setConfig(
    @Param('projectId') projectId: string,
    @Body() dto: SetRepoDto,
    @Req() req: any,
  ) {
    const id = await this.assert(projectId, req)
    this.requireManager(req)
    return this.gitService.setConfig(id, dto)
  }

  @Delete()
  @HttpCode(204)
  async deleteConfig(@Param('projectId') projectId: string, @Req() req: any) {
    const id = await this.assert(projectId, req)
    this.requireManager(req)
    await this.gitService.deleteConfig(id)
  }

  @Get('commits')
  async commits(
    @Param('projectId') projectId: string,
    @Query('branch') branch: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: any,
  ) {
    const id = await this.assert(projectId, req)
    const parsed = Number(limit)
    const take = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 20
    try {
      return await this.gitService.commits(id, branch || undefined, take)
    } catch (err) {
      this.wrap(err)
    }
  }

  @Get('branches')
  async branches(@Param('projectId') projectId: string, @Req() req: any) {
    const id = await this.assert(projectId, req)
    try {
      return await this.gitService.branches(id)
    } catch (err) {
      this.wrap(err)
    }
  }

  @Get('pulls')
  async pulls(@Param('projectId') projectId: string, @Req() req: any) {
    const id = await this.assert(projectId, req)
    try {
      return await this.gitService.pulls(id)
    } catch (err) {
      this.wrap(err)
    }
  }
}
