-- AlterEnum
ALTER TYPE "CalendarEventKind" ADD VALUE 'INTERVIEW';
ALTER TYPE "CalendarEventKind" ADD VALUE 'BATTLE';
ALTER TYPE "CalendarEventKind" ADD VALUE 'SHOP_EVENT';

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN "featuredUserId" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "opponentUserId" TEXT;

-- CreateIndex
CREATE INDEX "CalendarEvent_featuredUserId_idx" ON "CalendarEvent"("featuredUserId");
CREATE INDEX "CalendarEvent_opponentUserId_idx" ON "CalendarEvent"("opponentUserId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_featuredUserId_fkey" FOREIGN KEY ("featuredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_opponentUserId_fkey" FOREIGN KEY ("opponentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
