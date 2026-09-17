-- CreateEnum
CREATE TYPE "BroadcastRecurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Broadcast" ADD COLUMN "recurrence" "BroadcastRecurrence" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Broadcast" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/New_York';
ALTER TABLE "Broadcast" ADD COLUMN "scheduleHour" INTEGER NOT NULL DEFAULT 9;
ALTER TABLE "Broadcast" ADD COLUMN "scheduleMinute" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Broadcast" ADD COLUMN "scheduleWeekday" INTEGER;
ALTER TABLE "Broadcast" ADD COLUMN "scheduleMonthDay" INTEGER;
ALTER TABLE "Broadcast" ADD COLUMN "nextRunAt" TIMESTAMP(3);
ALTER TABLE "Broadcast" ADD COLUMN "lastRunAt" TIMESTAMP(3);
ALTER TABLE "Broadcast" ADD COLUMN "pausedAt" TIMESTAMP(3);
ALTER TABLE "Broadcast" ADD COLUMN "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Broadcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Broadcast_status_nextRunAt_idx" ON "Broadcast"("status", "nextRunAt");
