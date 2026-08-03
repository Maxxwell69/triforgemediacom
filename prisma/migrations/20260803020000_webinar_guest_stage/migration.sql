-- AlterTable
ALTER TABLE "WebinarGuest" ADD COLUMN "role" "WebinarParticipantRole" NOT NULL DEFAULT 'AUDIENCE';
ALTER TABLE "WebinarGuest" ADD COLUMN "forcedAudience" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WebinarGuest" ADD COLUMN "stageRequestStatus" "StageRequestStatus";
ALTER TABLE "WebinarGuest" ADD COLUMN "stageRequestedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WebinarGuest_webinarId_stageRequestStatus_idx" ON "WebinarGuest"("webinarId", "stageRequestStatus");
