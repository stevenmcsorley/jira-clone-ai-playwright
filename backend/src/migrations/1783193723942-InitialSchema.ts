import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783193723942 implements MigrationInterface {
    name = 'InitialSchema1783193723942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Baseline guard: databases created by TypeORM synchronize already have
        // this schema. Returning early records the migration as applied without
        // touching them; later migrations still run normally.
        if (await queryRunner.hasTable('users')) {
            return;
        }
        await queryRunner.query(`CREATE TABLE "comments" ("id" SERIAL NOT NULL, "content" text NOT NULL, "authorId" integer NOT NULL, "issueId" integer NOT NULL, "parentId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isEdited" boolean NOT NULL DEFAULT false, "editedAt" TIMESTAMP, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attachments" ("id" SERIAL NOT NULL, "filename" character varying NOT NULL, "originalName" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" integer NOT NULL, "path" character varying NOT NULL, "uploadedById" integer NOT NULL, "issueId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."subtasks_status_enum" AS ENUM('todo', 'in_progress', 'code_review', 'done')`);
        await queryRunner.query(`CREATE TABLE "subtasks" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "completed" boolean NOT NULL, "issueId" integer NOT NULL, "assigneeId" integer, "position" integer NOT NULL DEFAULT '0', "status" "public"."subtasks_status_enum" NOT NULL DEFAULT 'todo', CONSTRAINT "PK_035c1c153f0239ecc95be448d96" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."issue_links_linktype_enum" AS ENUM('blocks', 'blocked_by', 'duplicates', 'duplicated_by', 'relates_to', 'causes', 'caused_by', 'clones', 'cloned_by', 'child_of', 'parent_of')`);
        await queryRunner.query(`CREATE TABLE "issue_links" ("id" SERIAL NOT NULL, "sourceIssueId" integer NOT NULL, "targetIssueId" integer NOT NULL, "linkType" "public"."issue_links_linktype_enum" NOT NULL, "createdById" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92c961bad3a83cebd040a61d87f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sprints_status_enum" AS ENUM('future', 'active', 'completed')`);
        await queryRunner.query(`CREATE TABLE "sprints" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "goal" text, "status" "public"."sprints_status_enum" NOT NULL DEFAULT 'future', "projectId" integer NOT NULL, "startDate" TIMESTAMP, "endDate" TIMESTAMP, "position" integer NOT NULL DEFAULT '0', "createdById" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6800aa2e0f508561812c4b9afb4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."issues_status_enum" AS ENUM('todo', 'in_progress', 'code_review', 'done')`);
        await queryRunner.query(`CREATE TYPE "public"."issues_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);
        await queryRunner.query(`CREATE TYPE "public"."issues_type_enum" AS ENUM('story', 'task', 'bug', 'epic')`);
        await queryRunner.query(`CREATE TABLE "issues" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text, "status" "public"."issues_status_enum" NOT NULL DEFAULT 'todo', "priority" "public"."issues_priority_enum" NOT NULL DEFAULT 'medium', "type" "public"."issues_type_enum" NOT NULL DEFAULT 'task', "projectId" integer NOT NULL, "assigneeId" integer, "reporterId" integer NOT NULL, "estimate" numeric(5,2), "storyPoints" character varying(10), "labels" text array NOT NULL DEFAULT '{}', "position" integer NOT NULL DEFAULT '0', "epicId" integer, "sprintId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9d8ecbbeff46229c700f0449257" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "key" character varying NOT NULL, "description" character varying, "leadId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_63e67599567b2126cfef14e1474" UNIQUE ("key"), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "avatar" character varying, "password" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'member', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "time_logs" ("id" SERIAL NOT NULL, "hours" numeric(5,2) NOT NULL, "date" TIMESTAMP NOT NULL, "description" text, "userId" integer NOT NULL, "issueId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8657e6aaa7035da9fc7309f385a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."estimation_participants_status_enum" AS ENUM('invited', 'joined', 'voting', 'voted', 'left')`);
        await queryRunner.query(`CREATE TABLE "estimation_participants" ("id" SERIAL NOT NULL, "sessionId" integer NOT NULL, "userId" integer NOT NULL, "status" "public"."estimation_participants_status_enum" NOT NULL DEFAULT 'invited', "isOnline" boolean NOT NULL DEFAULT false, "lastSeenAt" TIMESTAMP, "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e51a6d88826e8c93b9b9ff5894f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."estimation_sessions_status_enum" AS ENUM('created', 'waiting', 'voting', 'discussing', 'completed')`);
        await queryRunner.query(`CREATE TYPE "public"."estimation_sessions_estimationscale_enum" AS ENUM('fibonacci', 'tshirt', 'hours', 'days', 'power_of_2', 'linear', 'modified_fibonacci', 'story_points')`);
        await queryRunner.query(`CREATE TABLE "estimation_sessions" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "status" "public"."estimation_sessions_status_enum" NOT NULL DEFAULT 'created', "estimationScale" "public"."estimation_sessions_estimationscale_enum" NOT NULL DEFAULT 'fibonacci', "anonymousVoting" boolean NOT NULL DEFAULT false, "discussionTimeLimit" integer NOT NULL DEFAULT '120', "autoReveal" boolean NOT NULL DEFAULT true, "currentIssueId" integer, "facilitatorId" integer, "projectId" integer NOT NULL, "sprintId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_28d08e977efbf4d801982278a87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "estimation_votes" ("id" SERIAL NOT NULL, "sessionIssueId" integer NOT NULL, "voterId" integer NOT NULL, "estimate" numeric(5,2) NOT NULL, "estimateText" character varying NOT NULL, "round" integer NOT NULL DEFAULT '1', "rationale" text, "isRevealed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c3914b4b0bab9b6c10a644a9161" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."session_issues_status_enum" AS ENUM('pending', 'voting', 'discussing', 'estimated', 'skipped')`);
        await queryRunner.query(`CREATE TABLE "session_issues" ("id" SERIAL NOT NULL, "sessionId" integer NOT NULL, "issueId" integer NOT NULL, "status" "public"."session_issues_status_enum" NOT NULL DEFAULT 'pending', "position" integer NOT NULL DEFAULT '0', "finalEstimate" numeric(5,2), "hasConsensus" boolean NOT NULL DEFAULT false, "votingRound" integer NOT NULL DEFAULT '0', "discussionNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ccb08d067f41e636a3771096fdd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "api_tokens" ("id" SERIAL NOT NULL, "token" character varying(64) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "expiresAt" TIMESTAMP, "lastUsedAt" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "scopes" json NOT NULL DEFAULT '[]', "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_01f4eacf4f2e7a4b4ce4000ce3d" UNIQUE ("token"), CONSTRAINT "PK_c587455266b5fa8dace7194caac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_4548cc4a409b8651ec75f70e280" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_87df5cc9d40c252f38b85618be1" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_8770bd9030a3d13c5f79a7d2e81" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attachments" ADD CONSTRAINT "FK_a436b9dc8304f58060e905eb705" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attachments" ADD CONSTRAINT "FK_a771e266d4d0ba5777e2ee94b68" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subtasks" ADD CONSTRAINT "FK_c0b95ff44a46461a2f88944ceb2" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subtasks" ADD CONSTRAINT "FK_d7cb66de8c03ad9835a52c6b3ad" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue_links" ADD CONSTRAINT "FK_7d889d3bfa5d57555d6d817dc67" FOREIGN KEY ("sourceIssueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue_links" ADD CONSTRAINT "FK_3dc7326c2192861e8206524fcc1" FOREIGN KEY ("targetIssueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue_links" ADD CONSTRAINT "FK_01ca2ac640b31c2063f9a849623" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sprints" ADD CONSTRAINT "FK_12a81f920cc034f4c532766bf18" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sprints" ADD CONSTRAINT "FK_24ac686fca5c960098bf7b4690d" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issues" ADD CONSTRAINT "FK_9f82fdfad8087663f95e203da67" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issues" ADD CONSTRAINT "FK_9a9187fec2a363ed3bbea2a6b63" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issues" ADD CONSTRAINT "FK_084190ca006e446a6387baef595" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issues" ADD CONSTRAINT "FK_712fa796d9dc2e256299d43222b" FOREIGN KEY ("epicId") REFERENCES "issues"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issues" ADD CONSTRAINT "FK_aed680c6a19809d2cca92f6d41e" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_646afe752c665e1b454a6e0dcc0" FOREIGN KEY ("leadId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_logs" ADD CONSTRAINT "FK_ffe67877eaeba4e553d64610a37" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_logs" ADD CONSTRAINT "FK_8e40a4dd1e3a244dee35cb5a4d5" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimation_participants" ADD CONSTRAINT "FK_b52834fe4917df6a0d727d221bf" FOREIGN KEY ("sessionId") REFERENCES "estimation_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimation_participants" ADD CONSTRAINT "FK_921bf5efa9591997e85aadff9e8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimation_sessions" ADD CONSTRAINT "FK_088460dccecc0c1ae1d27be67fb" FOREIGN KEY ("facilitatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimation_sessions" ADD CONSTRAINT "FK_16105100206f0cf8d6dec5cb889" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimation_sessions" ADD CONSTRAINT "FK_5dc78875afc681a8179e668b55b" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimation_votes" ADD CONSTRAINT "FK_0f9eb1ae6e9e2d07d78940eecd9" FOREIGN KEY ("sessionIssueId") REFERENCES "session_issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimation_votes" ADD CONSTRAINT "FK_a52e92c247cf45556b2f34c96da" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_issues" ADD CONSTRAINT "FK_4ded10b53f31af3c8a05ffa540b" FOREIGN KEY ("sessionId") REFERENCES "estimation_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_issues" ADD CONSTRAINT "FK_a94d1d2b65c3174ea8b074394f9" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_tokens" ADD CONSTRAINT "FK_2a2ce819bd75cc0193bfb2692bd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "api_tokens" DROP CONSTRAINT "FK_2a2ce819bd75cc0193bfb2692bd"`);
        await queryRunner.query(`ALTER TABLE "session_issues" DROP CONSTRAINT "FK_a94d1d2b65c3174ea8b074394f9"`);
        await queryRunner.query(`ALTER TABLE "session_issues" DROP CONSTRAINT "FK_4ded10b53f31af3c8a05ffa540b"`);
        await queryRunner.query(`ALTER TABLE "estimation_votes" DROP CONSTRAINT "FK_a52e92c247cf45556b2f34c96da"`);
        await queryRunner.query(`ALTER TABLE "estimation_votes" DROP CONSTRAINT "FK_0f9eb1ae6e9e2d07d78940eecd9"`);
        await queryRunner.query(`ALTER TABLE "estimation_sessions" DROP CONSTRAINT "FK_5dc78875afc681a8179e668b55b"`);
        await queryRunner.query(`ALTER TABLE "estimation_sessions" DROP CONSTRAINT "FK_16105100206f0cf8d6dec5cb889"`);
        await queryRunner.query(`ALTER TABLE "estimation_sessions" DROP CONSTRAINT "FK_088460dccecc0c1ae1d27be67fb"`);
        await queryRunner.query(`ALTER TABLE "estimation_participants" DROP CONSTRAINT "FK_921bf5efa9591997e85aadff9e8"`);
        await queryRunner.query(`ALTER TABLE "estimation_participants" DROP CONSTRAINT "FK_b52834fe4917df6a0d727d221bf"`);
        await queryRunner.query(`ALTER TABLE "time_logs" DROP CONSTRAINT "FK_8e40a4dd1e3a244dee35cb5a4d5"`);
        await queryRunner.query(`ALTER TABLE "time_logs" DROP CONSTRAINT "FK_ffe67877eaeba4e553d64610a37"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_646afe752c665e1b454a6e0dcc0"`);
        await queryRunner.query(`ALTER TABLE "issues" DROP CONSTRAINT "FK_aed680c6a19809d2cca92f6d41e"`);
        await queryRunner.query(`ALTER TABLE "issues" DROP CONSTRAINT "FK_712fa796d9dc2e256299d43222b"`);
        await queryRunner.query(`ALTER TABLE "issues" DROP CONSTRAINT "FK_084190ca006e446a6387baef595"`);
        await queryRunner.query(`ALTER TABLE "issues" DROP CONSTRAINT "FK_9a9187fec2a363ed3bbea2a6b63"`);
        await queryRunner.query(`ALTER TABLE "issues" DROP CONSTRAINT "FK_9f82fdfad8087663f95e203da67"`);
        await queryRunner.query(`ALTER TABLE "sprints" DROP CONSTRAINT "FK_24ac686fca5c960098bf7b4690d"`);
        await queryRunner.query(`ALTER TABLE "sprints" DROP CONSTRAINT "FK_12a81f920cc034f4c532766bf18"`);
        await queryRunner.query(`ALTER TABLE "issue_links" DROP CONSTRAINT "FK_01ca2ac640b31c2063f9a849623"`);
        await queryRunner.query(`ALTER TABLE "issue_links" DROP CONSTRAINT "FK_3dc7326c2192861e8206524fcc1"`);
        await queryRunner.query(`ALTER TABLE "issue_links" DROP CONSTRAINT "FK_7d889d3bfa5d57555d6d817dc67"`);
        await queryRunner.query(`ALTER TABLE "subtasks" DROP CONSTRAINT "FK_d7cb66de8c03ad9835a52c6b3ad"`);
        await queryRunner.query(`ALTER TABLE "subtasks" DROP CONSTRAINT "FK_c0b95ff44a46461a2f88944ceb2"`);
        await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "FK_a771e266d4d0ba5777e2ee94b68"`);
        await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "FK_a436b9dc8304f58060e905eb705"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_8770bd9030a3d13c5f79a7d2e81"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_87df5cc9d40c252f38b85618be1"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_4548cc4a409b8651ec75f70e280"`);
        await queryRunner.query(`DROP TABLE "api_tokens"`);
        await queryRunner.query(`DROP TABLE "session_issues"`);
        await queryRunner.query(`DROP TYPE "public"."session_issues_status_enum"`);
        await queryRunner.query(`DROP TABLE "estimation_votes"`);
        await queryRunner.query(`DROP TABLE "estimation_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."estimation_sessions_estimationscale_enum"`);
        await queryRunner.query(`DROP TYPE "public"."estimation_sessions_status_enum"`);
        await queryRunner.query(`DROP TABLE "estimation_participants"`);
        await queryRunner.query(`DROP TYPE "public"."estimation_participants_status_enum"`);
        await queryRunner.query(`DROP TABLE "time_logs"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TABLE "issues"`);
        await queryRunner.query(`DROP TYPE "public"."issues_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."issues_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."issues_status_enum"`);
        await queryRunner.query(`DROP TABLE "sprints"`);
        await queryRunner.query(`DROP TYPE "public"."sprints_status_enum"`);
        await queryRunner.query(`DROP TABLE "issue_links"`);
        await queryRunner.query(`DROP TYPE "public"."issue_links_linktype_enum"`);
        await queryRunner.query(`DROP TABLE "subtasks"`);
        await queryRunner.query(`DROP TYPE "public"."subtasks_status_enum"`);
        await queryRunner.query(`DROP TABLE "attachments"`);
        await queryRunner.query(`DROP TABLE "comments"`);
    }

}
