-- AlterTable
ALTER TABLE "HubCampaignSlot" ADD COLUMN "network" TEXT;
ALTER TABLE "HubCampaignSlot" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 1;

-- Backfill slot numbers per campaign (earliest time first)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "campaignId" ORDER BY "startsAt" ASC, id ASC) AS rn
  FROM "HubCampaignSlot"
)
UPDATE "HubCampaignSlot" AS slot
SET "position" = numbered.rn
FROM numbered
WHERE slot.id = numbered.id;

-- CreateIndex
CREATE INDEX "HubCampaignSlot_campaignId_position_idx" ON "HubCampaignSlot"("campaignId", "position");
