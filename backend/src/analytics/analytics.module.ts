import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsService } from './analytics.service'
import { VelocityService } from './velocity.service'
import { Issue } from '../issues/entities/issue.entity'
import { Sprint } from '../sprints/entities/sprint.entity'
import { Project } from '../projects/entities/project.entity'
import { User } from '../users/entities/user.entity'
import { TimeLog } from '../issues/entities/time-log.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Issue,
      Sprint,
      Project,
      User,
      TimeLog,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, VelocityService],
  exports: [AnalyticsService, VelocityService],
})
export class AnalyticsModule {}