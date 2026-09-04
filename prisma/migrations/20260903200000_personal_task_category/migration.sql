-- AlterTable
ALTER TABLE "PersonalTask" ADD COLUMN "category" TEXT;

-- CreateIndex
CREATE INDEX "PersonalTask_userId_category_idx" ON "PersonalTask"("userId", "category");
