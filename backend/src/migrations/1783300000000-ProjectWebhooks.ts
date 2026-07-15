import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectWebhooks1783300000000 implements MigrationInterface {
    name = 'ProjectWebhooks1783300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "project_webhooks" ("id" SERIAL NOT NULL, "projectId" integer NOT NULL, "label" character varying NOT NULL DEFAULT 'Chat webhook', "url" character varying NOT NULL, "events" text array NOT NULL DEFAULT '{}', "active" boolean NOT NULL DEFAULT true, "secret" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_project_webhooks" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_project_webhooks_projectId" ON "project_webhooks" ("projectId")`);
        await queryRunner.query(`ALTER TABLE "project_webhooks" ADD CONSTRAINT "FK_project_webhooks_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_webhooks" DROP CONSTRAINT "FK_project_webhooks_project"`);
        await queryRunner.query(`DROP INDEX "IDX_project_webhooks_projectId"`);
        await queryRunner.query(`DROP TABLE "project_webhooks"`);
    }

}
