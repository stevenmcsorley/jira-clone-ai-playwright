import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from './users/users.module'
import { ProjectsModule } from './projects/projects.module'
import { IssuesModule } from './issues/issues.module'
import { SprintsModule } from './sprints/sprints.module'
import { AuthModule } from './auth/auth.module'
import { EstimationModule } from './estimation/estimation.module'
import { AnalyticsModule } from './analytics/analytics.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    UsersModule,
    ProjectsModule,
    IssuesModule,
    SprintsModule,
    AuthModule,
    EstimationModule,
    AnalyticsModule,
  ],
})
export class AppModule {}