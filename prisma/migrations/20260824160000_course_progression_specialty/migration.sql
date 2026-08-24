-- AlterTable
ALTER TABLE "Course" ADD COLUMN "progressionSpecialty" TEXT;

-- CreateIndex
CREATE INDEX "Course_progressionSpecialty_idx" ON "Course"("progressionSpecialty");
