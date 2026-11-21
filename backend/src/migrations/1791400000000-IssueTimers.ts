import { MigrationInterface, QueryRunner } from 'typeorm'

/** Server-side issue timers, so the UI, the API and MCP agents all drive the same timer. */
export class IssueTimers1791400000000 implements MigrationInterface {
  name = 'IssueTimers1791400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "issue_timers" (
        "id" SERIAL NOT NULL,
        "issueId" integer NOT NULL,
        "userId" integer NOT NULL,
        "status" character varying(10) NOT NULL DEFAULT 'stopped',
        "startedAt" TIMESTAMP WITH TIME ZONE,
        "accumulatedMs" bigint NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_issue_timers_issue_user" UNIQUE ("issueId", "userId"),
        CONSTRAINT "PK_issue_timers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_issue_timers_issue" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_issue_timers_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_issue_timers_user_status" ON "issue_timers" ("userId", "status")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "issue_timers"`)
  }
}
