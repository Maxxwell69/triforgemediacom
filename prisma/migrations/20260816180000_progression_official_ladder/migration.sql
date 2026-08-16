-- CreateEnum
CREATE TYPE "ProgressionMilestoneMode" AS ENUM ('ALL', 'ANY');

-- AlterTable
ALTER TABLE "ProgressionLevel" ADD COLUMN "milestoneMode" "ProgressionMilestoneMode" NOT NULL DEFAULT 'ALL';

-- AlterTable
ALTER TABLE "ProgressionCategory" ADD COLUMN "unlockAtLevelId" TEXT;

-- AlterTable
ALTER TABLE "ProgressionLevelCertReq" ADD COLUMN "tierId" TEXT;

-- AlterTable
ALTER TABLE "ProgressionSkill" ADD COLUMN "certTierId" TEXT;

-- AddForeignKey
ALTER TABLE "ProgressionCategory" ADD CONSTRAINT "ProgressionCategory_unlockAtLevelId_fkey" FOREIGN KEY ("unlockAtLevelId") REFERENCES "ProgressionLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionLevelCertReq" ADD CONSTRAINT "ProgressionLevelCertReq_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "ProgressionCertTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionSkill" ADD CONSTRAINT "ProgressionSkill_certTierId_fkey" FOREIGN KEY ("certTierId") REFERENCES "ProgressionCertTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
