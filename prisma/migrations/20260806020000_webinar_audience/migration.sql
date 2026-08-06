-- CreateEnum
CREATE TYPE "WebinarAudience" AS ENUM ('ALL', 'CN', 'MN', 'ADMIN');

-- AlterTable
ALTER TABLE "Webinar" ADD COLUMN "audience" "WebinarAudience" NOT NULL DEFAULT 'ALL';

-- CreateIndex
CREATE INDEX "Webinar_audience_status_scheduledAt_idx" ON "Webinar"("audience", "status", "scheduledAt");
