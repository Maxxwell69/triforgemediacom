-- AlterTable
ALTER TABLE "BugReport" ADD COLUMN "sourceMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BugReport_sourceMessageId_key" ON "BugReport"("sourceMessageId");
