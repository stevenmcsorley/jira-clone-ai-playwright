import 'reflect-metadata'
import { DataSource } from 'typeorm'

/**
 * DataSource for the TypeORM CLI (migration:generate / migration:run).
 * The running app configures TypeORM itself in app.module.ts — keep the
 * entities/migrations globs in both places in sync.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://ossicone:secret@localhost:5432/ossicone',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
})
