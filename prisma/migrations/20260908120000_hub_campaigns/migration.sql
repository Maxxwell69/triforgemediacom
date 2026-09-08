-- CreateEnum
CREATE TYPE "HubCampaignCategory" AS ENUM ('INTERVIEWS', 'MEETING', 'GAMES', 'BATTLES');

-- CreateEnum
CREATE TYPE "HubCampaignStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "HubCampaignAudienceType" AS ENUM ('ALL_MEMBERS', 'TAG', 'BADGE');

-- CreateEnum
CREATE TYPE "HubCampaignTaskStatus" AS ENUM ('TODO', 'DONE');

-- CreateTable
CREATE TABLE "HubCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "HubCampaignCategory" NOT NULL,
    "status" "HubCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "audienceType" "HubCampaignAudienceType" NOT NULL DEFAULT 'ALL_MEMBERS',
    "audienceTagId" TEXT,
    "audienceBadgeId" TEXT,
    "capacity" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubCampaignSignup" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubCampaignSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubCampaignTask" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "HubCampaignTaskStatus" NOT NULL DEFAULT 'TODO',
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubCampaignTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HubCampaign_status_category_idx" ON "HubCampaign"("status", "category");

-- CreateIndex
CREATE INDEX "HubCampaign_startsAt_idx" ON "HubCampaign"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "HubCampaignSignup_campaignId_userId_key" ON "HubCampaignSignup"("campaignId", "userId");

-- CreateIndex
CREATE INDEX "HubCampaignSignup_userId_idx" ON "HubCampaignSignup"("userId");

-- CreateIndex
CREATE INDEX "HubCampaignTask_campaignId_sortOrder_idx" ON "HubCampaignTask"("campaignId", "sortOrder");

-- AddForeignKey
ALTER TABLE "HubCampaign" ADD CONSTRAINT "HubCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCampaign" ADD CONSTRAINT "HubCampaign_audienceTagId_fkey" FOREIGN KEY ("audienceTagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCampaign" ADD CONSTRAINT "HubCampaign_audienceBadgeId_fkey" FOREIGN KEY ("audienceBadgeId") REFERENCES "Badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCampaignSignup" ADD CONSTRAINT "HubCampaignSignup_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "HubCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCampaignSignup" ADD CONSTRAINT "HubCampaignSignup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCampaignTask" ADD CONSTRAINT "HubCampaignTask_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "HubCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCampaignTask" ADD CONSTRAINT "HubCampaignTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCampaignTask" ADD CONSTRAINT "HubCampaignTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
