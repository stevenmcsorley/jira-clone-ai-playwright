import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common'
import { WikiService } from './wiki.service'
import { CreateWikiPageDto, UpdateWikiPageDto } from './dto/create-wiki-page.dto'
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service'

@Controller('api/projects/:projectId/wiki')
export class WikiController {
  constructor(
    private readonly wikiService: WikiService,
    private readonly scope: WorkspaceScopeService,
  ) {}

  private async assert(projectId: string, req: any): Promise<number> {
    const id = +projectId
    await this.scope.assertProject(id, req.workspaceId)
    return id
  }

  @Get()
  async list(@Param('projectId') projectId: string, @Req() req: any) {
    return this.wikiService.findByProject(await this.assert(projectId, req))
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateWikiPageDto,
    @Req() req: any,
  ) {
    const id = await this.assert(projectId, req)
    return this.wikiService.create(id, dto, req.user?.id ?? null)
  }

  @Get(':pageId')
  async get(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Req() req: any,
  ) {
    const id = await this.assert(projectId, req)
    return this.wikiService.findOne(id, +pageId)
  }

  @Patch(':pageId')
  async update(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Body() dto: UpdateWikiPageDto,
    @Req() req: any,
  ) {
    const id = await this.assert(projectId, req)
    return this.wikiService.update(id, +pageId, dto)
  }

  @Delete(':pageId')
  @HttpCode(204)
  async remove(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Req() req: any,
  ) {
    const id = await this.assert(projectId, req)
    await this.wikiService.remove(id, +pageId)
  }
}
