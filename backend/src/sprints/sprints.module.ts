import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Sprint } from './entities/sprint.entity'
import { Issue } from '../issues/entities/issue.entity'
import { SprintsService } from './sprints.service'
import { SprintsController } from './sprints.controller'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Issue]), EventsModule],
  providers: [SprintsService],
  controllers: [SprintsController],
  exports: [SprintsService],
})
export class SprintsModule {}