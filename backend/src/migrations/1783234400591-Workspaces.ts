import { MigrationInterface, QueryRunner } from "typeorm";

export class Workspaces1783234400591 implements MigrationInterface {
    name = 'Workspaces1783234400591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "workspace_members" ("id" SERIAL NOT NULL, "workspaceId" integer NOT NULL, "userId" integer NOT NULL, "role" character varying NOT NULL DEFAULT 'member', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_99bcb5fdac446371d41f048b24f" UNIQUE ("workspaceId", "userId"), CONSTRAINT "PK_22ab43ac5865cd62769121d2bc4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workspaces" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workspace_invites" ("id" SERIAL NOT NULL, "workspaceId" integer NOT NULL, "email" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'member', "token" character varying NOT NULL, "invitedById" integer NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "acceptedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_52c6f7f77e04ee30c5ff3f0012f" UNIQUE ("token"), CONSTRAINT "PK_43f7a0e0b0549fe2581e9cb57bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "workspaceId" integer`);
        await queryRunner.query(`ALTER TABLE "api_tokens" ADD "workspaceId" integer`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_108ff8a2d40c2b294511c92a7c8" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_22176b38813258c2aadaae32448" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ADD CONSTRAINT "FK_15fbf04707ec6ecaad8667fbc25" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ADD CONSTRAINT "FK_470772a0258ef0eb2ecbfee9345" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Backfill for pre-workspace installs: put everything that already
        // exists into one default workspace. Global admins become owners.
        // Fresh databases have no users yet, so this is a no-op there.
        const users = await queryRunner.query(`SELECT id, role FROM users`);
        if (users.length > 0) {
            const ws = await queryRunner.query(
                `INSERT INTO workspaces (name) VALUES ('halfagiraf') RETURNING id`
            );
            const workspaceId = ws[0].id;
            await queryRunner.query(
                `INSERT INTO workspace_members ("workspaceId", "userId", role)
                 SELECT $1, id, CASE WHEN role = 'admin' THEN 'owner' ELSE 'member' END FROM users`,
                [workspaceId]
            );
            await queryRunner.query(
                `UPDATE projects SET "workspaceId" = $1 WHERE "workspaceId" IS NULL`,
                [workspaceId]
            );
            await queryRunner.query(
                `UPDATE api_tokens SET "workspaceId" = $1 WHERE "workspaceId" IS NULL`,
                [workspaceId]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_invites" DROP CONSTRAINT "FK_470772a0258ef0eb2ecbfee9345"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" DROP CONSTRAINT "FK_15fbf04707ec6ecaad8667fbc25"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_22176b38813258c2aadaae32448"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_108ff8a2d40c2b294511c92a7c8"`);
        await queryRunner.query(`ALTER TABLE "api_tokens" DROP COLUMN "workspaceId"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "workspaceId"`);
        await queryRunner.query(`DROP TABLE "workspace_invites"`);
        await queryRunner.query(`DROP TABLE "workspaces"`);
        await queryRunner.query(`DROP TABLE "workspace_members"`);
    }

}
