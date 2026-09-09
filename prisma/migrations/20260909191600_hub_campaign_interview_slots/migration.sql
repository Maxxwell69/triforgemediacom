-- CreateTable
CREATE TABLE "HubCampaignSlot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubCampaignSlot_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "HubCampaignSignup" ADD COLUMN "slotId" TEXT;

-- CreateIndex
CREATE INDEX "HubCampaignSlot_campaignId_startsAt_idx" ON "HubCampaignSlot"("campaignId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "HubCampaignSignup_slotId_key" ON "HubCampaignSignup"("slotId");

-- AddForeignKey
ALTER TABLE "HubCampaignSlot" ADD CONSTRAINT "HubCampaignSlot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "HubCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCampaignSignup" ADD CONSTRAINT "HubCampaignSignup_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "HubCampaignSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
