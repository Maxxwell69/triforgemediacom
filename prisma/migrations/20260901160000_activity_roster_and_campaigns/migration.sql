-- AlterTable
ALTER TABLE "User" ADD COLUMN "firstLoginAt" TIMESTAMP(3);

-- Backfill first login from lastLoginAt for anyone who has already signed in
UPDATE "User" SET "firstLoginAt" = "lastLoginAt" WHERE "lastLoginAt" IS NOT NULL AND "firstLoginAt" IS NULL;

-- CreateTable
CREATE TABLE "TikTokLiveSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "roomId" TEXT,
    "title" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "lastSeenLiveAt" TIMESTAMP(3) NOT NULL,
    "peakViewers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TikTokLiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TikTokLiveSession_userId_startedAt_idx" ON "TikTokLiveSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "TikTokLiveSession_userId_endedAt_idx" ON "TikTokLiveSession"("userId", "endedAt");

-- AddForeignKey
ALTER TABLE "TikTokLiveSession" ADD CONSTRAINT "TikTokLiveSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "CampaignTriggerType" AS ENUM ('FIRST_LOGIN', 'MEMBER_JOINED', 'APPLICATION_APPROVED', 'TAG_ADDED', 'LEVEL_REACHED', 'WENT_LIVE', 'INACTIVE_DAYS', 'NEVER_LOGGED_IN', 'DAYS_AFTER_FIRST_LOGIN');

-- CreateEnum
CREATE TYPE "CampaignActionType" AS ENUM ('EMAIL', 'HUB_NOTIFY', 'ADMIN_NOTIFY');

-- CreateEnum
CREATE TYPE "CampaignAudienceType" AS ENUM ('ALL_MEMBERS', 'TAG', 'GROUP', 'NETWORK_TRACK');

-- CreateEnum
CREATE TYPE "CampaignRunStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" "CampaignTriggerType" NOT NULL,
    "triggerConfig" JSONB NOT NULL DEFAULT '{}',
    "audienceType" "CampaignAudienceType" NOT NULL DEFAULT 'ALL_MEMBERS',
    "audienceTagId" TEXT,
    "audienceGroupId" TEXT,
    "audienceTrack" TEXT,
    "oncePerUser" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAction" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "type" "CampaignActionType" NOT NULL,
    "emailSubject" TEXT,
    "emailBodyText" TEXT,
    "notifyTitle" TEXT,
    "notifyBody" TEXT,
    "notifyHref" TEXT,

    CONSTRAINT "CampaignAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRun" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "triggerKey" TEXT NOT NULL,
    "status" "CampaignRunStatus" NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_enabled_triggerType_idx" ON "Campaign"("enabled", "triggerType");

-- CreateIndex
CREATE INDEX "CampaignAction_campaignId_sortOrder_idx" ON "CampaignAction"("campaignId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRun_campaignId_userId_triggerKey_key" ON "CampaignRun"("campaignId", "userId", "triggerKey");

-- CreateIndex
CREATE INDEX "CampaignRun_campaignId_createdAt_idx" ON "CampaignRun"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "HubNotification_userId_createdAt_idx" ON "HubNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "HubNotification_userId_readAt_idx" ON "HubNotification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAction" ADD CONSTRAINT "CampaignAction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRun" ADD CONSTRAINT "CampaignRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRun" ADD CONSTRAINT "CampaignRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubNotification" ADD CONSTRAINT "HubNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
