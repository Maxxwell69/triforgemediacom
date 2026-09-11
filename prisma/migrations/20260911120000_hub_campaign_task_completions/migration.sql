-- CreateTable
CREATE TABLE "HubCampaignTaskCompletion" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubCampaignTaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HubCampaignTaskCompletion_taskId_userId_key" ON "HubCampaignTaskCompletion"("taskId", "userId");

-- CreateIndex
CREATE INDEX "HubCampaignTaskCompletion_userId_idx" ON "HubCampaignTaskCompletion"("userId");

-- AddForeignKey
ALTER TABLE "HubCampaignTaskCompletion" ADD CONSTRAINT "HubCampaignTaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HubCampaignTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCampaignTaskCompletion" ADD CONSTRAINT "HubCampaignTaskCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry over any previously shared "done" marks to existing signups so we do
-- not wipe progress, but new joiners start their own checklist.
INSERT INTO "HubCampaignTaskCompletion" ("id", "taskId", "userId", "completedAt")
SELECT
  md5(t."id" || ':' || s."userId"),
  t."id",
  s."userId",
  t."updatedAt"
FROM "HubCampaignTask" t
JOIN "HubCampaignSignup" s ON s."campaignId" = t."campaignId"
WHERE t."status" = 'DONE'
  AND (t."assigneeId" IS NULL OR t."assigneeId" = s."userId")
ON CONFLICT ("taskId", "userId") DO NOTHING;
