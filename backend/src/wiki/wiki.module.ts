import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WikiPage } from './entities/wiki-page.entity'
import { Project } from '../projects/entities/project.entity'
import { WikiService } from './wiki.service'
import { WikiController } from './wiki.controller'
import { WorkspacesModule } from '../workspaces/workspaces.module'

@Module({
  imports: [TypeOrmModule.forFeature([WikiPage, Project]), WorkspacesModule],
  controllers: [WikiController],
  providers: [WikiService],
  exports: [WikiService],
})
export class WikiModule {}
