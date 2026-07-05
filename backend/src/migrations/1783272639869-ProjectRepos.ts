import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectRepos1783272639869 implements MigrationInterface {
    name = 'ProjectRepos1783272639869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "project_repos" ("id" SERIAL NOT NULL, "projectId" integer NOT NULL, "provider" character varying NOT NULL DEFAULT 'github', "owner" character varying NOT NULL, "repo" character varying NOT NULL, "token" character varying, "defaultBranch" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8f886ee4e2466bf71795f9eb164" UNIQUE ("projectId"), CONSTRAINT "REL_8f886ee4e2466bf71795f9eb16" UNIQUE ("projectId"), CONSTRAINT "PK_cb5a9c9440c16e3e6623eda6c29" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "project_repos" ADD CONSTRAINT "FK_8f886ee4e2466bf71795f9eb164" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_repos" DROP CONSTRAINT "FK_8f886ee4e2466bf71795f9eb164"`);
        await queryRunner.query(`DROP TABLE "project_repos"`);
    }

}
