-- AlterTable
ALTER TABLE "WebinarAttendance" ADD COLUMN     "forcedAudience" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WebinarAttendance" ADD COLUMN     "chatMutedUntil" TIMESTAMP(3);
ALTER TABLE "WebinarAttendance" ADD COLUMN     "kickedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WebinarChatMessage" ADD COLUMN     "deletedAt" TIMESTAMP(3);
