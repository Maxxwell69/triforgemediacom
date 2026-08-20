-- AlterTable
ALTER TABLE "ProgressionProfile" ADD COLUMN "adminPlacedLevelId" TEXT;

-- AddForeignKey
ALTER TABLE "ProgressionProfile" ADD CONSTRAINT "ProgressionProfile_adminPlacedLevelId_fkey" FOREIGN KEY ("adminPlacedLevelId") REFERENCES "ProgressionLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
