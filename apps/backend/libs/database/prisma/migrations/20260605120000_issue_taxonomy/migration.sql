-- Denormalize exception type and capture mechanism for issue list columns.
ALTER TABLE "issues" ADD COLUMN "exception_type" TEXT;
ALTER TABLE "issues" ADD COLUMN "mechanism" TEXT;
