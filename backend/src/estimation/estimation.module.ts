import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EstimationController } from './estimation.controller'
import { EstimationService } from './estimation.service'
import { EstimationScalesService } from './estimation-scales.service'
import { EstimationSession } from './entities/estimation-session.entity'
import { EstimationParticipant } from './entities/estimation-participant.entity'
import { SessionIssue } from './entities/session-issue.entity'
import { EstimationVote } from './entities/estimation-vote.entity'
import { Issue } from '../issues/entities/issue.entity'
import { User } from '../users/entities/user.entity'
import { Project } from '../projects/entities/project.entity'
import { Sprint } from '../sprints/entities/sprint.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstimationSession,
      EstimationParticipant,
      SessionIssue,
      EstimationVote,
      Issue,
      User,
      Project,
      Sprint,
    ]),
  ],
  controllers: [EstimationController],
  providers: [EstimationService, EstimationScalesService],
  exports: [EstimationService, EstimationScalesService],
})
export class EstimationModule {}