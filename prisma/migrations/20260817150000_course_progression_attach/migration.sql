-- AlterTable
ALTER TABLE "Course" ADD COLUMN "progressionEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "progressionCategoryId" TEXT;
ALTER TABLE "Course" ADD COLUMN "progressionLevelId" TEXT;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_progressionCategoryId_fkey" FOREIGN KEY ("progressionCategoryId") REFERENCES "ProgressionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_progressionLevelId_fkey" FOREIGN KEY ("progressionLevelId") REFERENCES "ProgressionLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
