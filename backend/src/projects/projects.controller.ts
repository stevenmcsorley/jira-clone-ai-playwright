import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common'
import { ProjectsService } from './projects.service'
import { CreateProjectDto } from './dto/create-project.dto'

@Controller('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: any) {
    return this.projectsService.create({ ...createProjectDto, workspaceId: req.workspaceId })
  }

  @Get()
  findAll(@Req() req: any) {
    return this.projectsService.findAll(req.workspaceId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.findOne(+id, req.workspaceId)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<CreateProjectDto>, @Req() req: any) {
    // workspaceId is server-assigned; never accept it from the client
    delete (updateData as any).workspaceId
    return this.projectsService.update(+id, updateData, req.workspaceId)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.remove(+id, req.workspaceId)
  }
}
