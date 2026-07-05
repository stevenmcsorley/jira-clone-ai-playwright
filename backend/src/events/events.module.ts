import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { EventsGateway } from './events.gateway'
import { Project } from '../projects/entities/project.entity'
import { Issue } from '../issues/entities/issue.entity'
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Issue, WorkspaceMember]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    }),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
