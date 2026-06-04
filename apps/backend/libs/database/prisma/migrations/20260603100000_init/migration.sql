-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('UNRESOLVED', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'UNRESOLVED',
    "level" TEXT NOT NULL DEFAULT 'error',
    "first_seen" TIMESTAMP(3) NOT NULL,
    "last_seen" TIMESTAMP(3) NOT NULL,
    "event_count" INTEGER NOT NULL DEFAULT 0,
    "users_seen" INTEGER NOT NULL DEFAULT 0,
    "culprit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "issue_id" TEXT,
    "payload" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "aggregated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_public_key_key" ON "projects"("public_key");

-- CreateIndex
CREATE UNIQUE INDEX "projects_organization_id_slug_key" ON "projects"("organization_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "issues_project_id_fingerprint_key" ON "issues"("project_id", "fingerprint");

-- CreateIndex
CREATE INDEX "issues_project_id_status_last_seen_idx" ON "issues"("project_id", "status", "last_seen");

-- CreateIndex
CREATE UNIQUE INDEX "events_project_id_event_id_key" ON "events"("project_id", "event_id");

-- CreateIndex
CREATE INDEX "events_project_id_timestamp_idx" ON "events"("project_id", "timestamp");

-- CreateIndex
CREATE INDEX "events_aggregated_at_idx" ON "events"("aggregated_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
