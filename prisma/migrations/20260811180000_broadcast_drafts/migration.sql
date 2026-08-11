-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SENT');

-- AlterTable: expand Broadcast for shared drafts
ALTER TABLE "Broadcast" ADD COLUMN "bodyText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Broadcast" ADD COLUMN "audienceTagId" TEXT;
ALTER TABLE "Broadcast" ADD COLUMN "audienceGroupId" TEXT;
ALTER TABLE "Broadcast" ADD COLUMN "audienceTrack" TEXT;
ALTER TABLE "Broadcast" ADD COLUMN "audienceEmail" TEXT;
ALTER TABLE "Broadcast" ADD COLUMN "status" "BroadcastStatus" NOT NULL DEFAULT 'SENT';
ALTER TABLE "Broadcast" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Broadcast" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Broadcast" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing rows are historical sends: createdBy = original sender
UPDATE "Broadcast" SET "createdById" = "sentById", "status" = 'SENT', "updatedAt" = "sentAt";

ALTER TABLE "Broadcast" ALTER COLUMN "createdById" SET NOT NULL;
ALTER TABLE "Broadcast" ALTER COLUMN "bodyHtml" SET DEFAULT '';
ALTER TABLE "Broadcast" ALTER COLUMN "recipientCount" SET DEFAULT 0;
ALTER TABLE "Broadcast" ALTER COLUMN "sentById" DROP NOT NULL;
ALTER TABLE "Broadcast" ALTER COLUMN "sentAt" DROP NOT NULL;
ALTER TABLE "Broadcast" ALTER COLUMN "sentAt" DROP DEFAULT;

-- DropForeignKey
ALTER TABLE "Broadcast" DROP CONSTRAINT "Broadcast_sentById_fkey";

-- AddForeignKey
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Broadcast_status_updatedAt_idx" ON "Broadcast"("status", "updatedAt");
