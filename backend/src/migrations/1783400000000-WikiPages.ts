import { MigrationInterface, QueryRunner } from 'typeorm'

export class WikiPages1783400000000 implements MigrationInterface {
  name = 'WikiPages1783400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "wiki_pages" (` +
        `"id" SERIAL NOT NULL, ` +
        `"projectId" integer NOT NULL, ` +
        `"title" character varying NOT NULL, ` +
        `"slug" character varying NOT NULL, ` +
        `"content" text NOT NULL DEFAULT '', ` +
        `"authorId" integer, ` +
        `"createdAt" TIMESTAMP NOT NULL DEFAULT now(), ` +
        `"updatedAt" TIMESTAMP NOT NULL DEFAULT now(), ` +
        `CONSTRAINT "PK_wiki_pages" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_wiki_project_slug" ON "wiki_pages" ("projectId", "slug")`,
    )
    await queryRunner.query(
      `ALTER TABLE "wiki_pages" ADD CONSTRAINT "FK_wiki_project" ` +
        `FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wiki_pages" DROP CONSTRAINT "FK_wiki_project"`)
    await queryRunner.query(`DROP INDEX "UQ_wiki_project_slug"`)
    await queryRunner.query(`DROP TABLE "wiki_pages"`)
  }
}
