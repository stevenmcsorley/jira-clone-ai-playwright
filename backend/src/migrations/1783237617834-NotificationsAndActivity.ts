import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationsAndActivity1783237617834 implements MigrationInterface {
    name = 'NotificationsAndActivity1783237617834'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "workspaceId" integer NOT NULL, "type" character varying NOT NULL, "actorId" integer, "issueId" integer NOT NULL, "message" text NOT NULL, "read" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "issue_events" ("id" SERIAL NOT NULL, "issueId" integer NOT NULL, "actorId" integer, "field" character varying NOT NULL, "oldValue" text, "newValue" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eaec3490aa4d09d32ec1e8db141" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "subtasks" ALTER COLUMN "completed" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_0252715141cc24f79871554e249" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_44412a2d6f162ff4dc1697d0db7" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_d3e8c1af34d982772209ca2a061" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue_events" ADD CONSTRAINT "FK_8688776171befbb2106f902aa1f" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue_events" ADD CONSTRAINT "FK_0e3eca3d5b0cd1f5b21649f60cf" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "issue_events" DROP CONSTRAINT "FK_0e3eca3d5b0cd1f5b21649f60cf"`);
        await queryRunner.query(`ALTER TABLE "issue_events" DROP CONSTRAINT "FK_8688776171befbb2106f902aa1f"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_d3e8c1af34d982772209ca2a061"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_44412a2d6f162ff4dc1697d0db7"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_0252715141cc24f79871554e249"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "subtasks" ALTER COLUMN "completed" DROP DEFAULT`);
        await queryRunner.query(`DROP TABLE "issue_events"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
    }

}
