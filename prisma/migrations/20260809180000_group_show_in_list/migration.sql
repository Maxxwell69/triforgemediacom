-- AlterTable
ALTER TABLE "Group" ADD COLUMN "showInList" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Group_showInList_idx" ON "Group"("showInList");

-- Network track groups are membership categories, not browsable spaces.
UPDATE "Group" SET "showInList" = false WHERE "name" IN ('MN', 'CN');
