-- AlterTable
ALTER TABLE "artifacts" ADD COLUMN "bundle_url" TEXT;
ALTER TABLE "artifacts" ADD COLUMN "debug_id" TEXT;
ALTER TABLE "artifacts" ADD COLUMN "artifact_type" TEXT NOT NULL DEFAULT 'map';
ALTER TABLE "artifacts" ADD COLUMN "checksum" TEXT;

-- CreateIndex
CREATE INDEX "artifacts_release_id_debug_id_idx" ON "artifacts"("release_id", "debug_id");
CREATE INDEX "artifacts_release_id_bundle_url_idx" ON "artifacts"("release_id", "bundle_url");
