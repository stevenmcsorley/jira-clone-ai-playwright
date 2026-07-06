import { MigrationInterface, QueryRunner } from "typeorm";

export class WorkspaceIcon1783300000000 implements MigrationInterface {
    name = 'WorkspaceIcon1783300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Idempotent: dev DBs created by synchronize may already have these columns.
        const table = await queryRunner.getTable('workspaces')
        if (table && !table.findColumnByName('icon')) {
            await queryRunner.query(`ALTER TABLE "workspaces" ADD "icon" character varying(32)`);
        }
        const refreshed = await queryRunner.getTable('workspaces')
        if (refreshed && !refreshed.findColumnByName('iconImage')) {
            await queryRunner.query(`ALTER TABLE "workspaces" ADD "iconImage" text`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "iconImage"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "icon"`);
    }

}
