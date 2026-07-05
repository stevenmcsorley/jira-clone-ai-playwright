import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from './users/users.module'
import { ProjectsModule } from './projects/projects.module'
import { IssuesModule } from './issues/issues.module'
import { SprintsModule } from './sprints/sprints.module'
import { AuthModule } from './auth/auth.module'
import { WorkspacesModule } from './workspaces/workspaces.module'
import { EstimationModule } from './estimation/estimation.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { EventsModule } from './events/events.module'
import { NotificationsModule } from './notifications/notifications.module'
import { GitModule } from './git/git.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // Dev: schema auto-sync for fast iteration. Prod: deliberate migrations
      // (TYPEORM_MIGRATIONS=true runs them on boot; see src/migrations/).
      synchronize: process.env.NODE_ENV === 'development' || process.env.TYPEORM_SYNC === 'true',
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      migrationsRun: process.env.TYPEORM_MIGRATIONS === 'true',
      logging: process.env.NODE_ENV === 'development',
    }),
    UsersModule,
    ProjectsModule,
    IssuesModule,
    SprintsModule,
    AuthModule,
    WorkspacesModule,
    EstimationModule,
    AnalyticsModule,
    EventsModule,
    NotificationsModule,
    GitModule,
  ],
})
export class AppModule {}