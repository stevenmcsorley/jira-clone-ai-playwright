import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Databases created by TypeORM synchronize before code_review was added to
 * IssueStatus have 3-value enums, which made moving a card to the board's
 * CODE REVIEW column fail. Fresh databases get the 4-value enums from
 * InitialSchema; ADD VALUE IF NOT EXISTS makes this a no-op there.
 */
export class AddCodeReviewStatus1783193800000 implements MigrationInterface {
    name = 'AddCodeReviewStatus1783193800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."issues_status_enum" ADD VALUE IF NOT EXISTS 'code_review' BEFORE 'done'`);
        await queryRunner.query(`ALTER TYPE "public"."subtasks_status_enum" ADD VALUE IF NOT EXISTS 'code_review' BEFORE 'done'`);
    }

    public async down(): Promise<void> {
        // Removing an enum value requires rebuilding the type and every column
        // using it; not worth it for a value that is safe to leave in place.
    }
}
