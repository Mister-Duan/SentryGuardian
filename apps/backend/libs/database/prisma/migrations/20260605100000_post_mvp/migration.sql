-- Post-MVP schema: events history, releases, alerts, performance, project settings

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ERROR', 'TRANSACTION');
CREATE TYPE "AlertTrigger" AS ENUM ('NEW_ISSUE', 'ERROR_RATE');

-- AlterTable projects
ALTER TABLE "projects" ADD COLUMN "allowed_origins" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "projects" ADD COLUMN "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 100;

-- AlterTable issues
ALTER TABLE "issues" ADD COLUMN "environment" TEXT;
ALTER TABLE "issues" ADD COLUMN "release" TEXT;
ALTER TABLE "issues" ADD COLUMN "tags" TEXT;

CREATE INDEX "issues_project_id_environment_idx" ON "issues"("project_id", "environment");
CREATE INDEX "issues_project_id_release_idx" ON "issues"("project_id", "release");

-- AlterTable events
ALTER TABLE "events" ADD COLUMN "event_type" "EventType" NOT NULL DEFAULT 'ERROR';

CREATE INDEX "events_project_id_event_type_timestamp_idx" ON "events"("project_id", "event_type", "timestamp");
CREATE INDEX "events_issue_id_timestamp_idx" ON "events"("issue_id", "timestamp");

-- CreateTable releases
CREATE TABLE "releases" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "releases_project_id_version_key" ON "releases"("project_id", "version");

-- CreateTable artifacts
CREATE TABLE "artifacts" (
    "id" TEXT NOT NULL,
    "release_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source_map" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artifacts_release_id_name_key" ON "artifacts"("release_id", "name");

-- CreateTable alert_rules
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "AlertTrigger" NOT NULL,
    "webhook_url" TEXT,
    "email_to" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "alert_rules_project_id_enabled_idx" ON "alert_rules"("project_id", "enabled");

-- CreateTable issue_comments
CREATE TABLE "issue_comments" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "issue_comments_issue_id_created_at_idx" ON "issue_comments"("issue_id", "created_at");

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
