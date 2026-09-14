-- AlterTable
ALTER TABLE "HubCampaign" ADD COLUMN "bookingPageId" TEXT;

-- AlterTable
ALTER TABLE "HubCampaignSignup" ADD COLUMN "appointmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "HubCampaignSignup_appointmentId_key" ON "HubCampaignSignup"("appointmentId");

-- CreateIndex
CREATE INDEX "HubCampaign_bookingPageId_idx" ON "HubCampaign"("bookingPageId");

-- AddForeignKey
ALTER TABLE "HubCampaign" ADD CONSTRAINT "HubCampaign_bookingPageId_fkey" FOREIGN KEY ("bookingPageId") REFERENCES "BookingPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCampaignSignup" ADD CONSTRAINT "HubCampaignSignup_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
