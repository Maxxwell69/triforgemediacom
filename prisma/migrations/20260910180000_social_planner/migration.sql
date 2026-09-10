-- CreateEnum
CREATE TYPE "SocialPlannerItemKind" AS ENUM ('VIDEO', 'PHOTO', 'LIVE');

-- CreateEnum
CREATE TYPE "SocialPlannerItemStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "SocialPlannerAccount" (
    "id" TEXT NOT NULL,
    "connectedById" TEXT NOT NULL,
    "openId" TEXT NOT NULL,
    "username" TEXT,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT NOT NULL,
    "privacyLevelOptions" JSONB,
    "maxVideoDurationSec" INTEGER,
    "commentDisabled" BOOLEAN NOT NULL DEFAULT false,
    "duetDisabled" BOOLEAN NOT NULL DEFAULT false,
    "stitchDisabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPlannerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPlannerItem" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "kind" "SocialPlannerItemKind" NOT NULL,
    "status" "SocialPlannerItemStatus" NOT NULL DEFAULT 'DRAFT',
    "caption" TEXT NOT NULL DEFAULT '',
    "title" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "privacyLevel" TEXT NOT NULL DEFAULT 'SELF_ONLY',
    "disableComment" BOOLEAN NOT NULL DEFAULT false,
    "disableDuet" BOOLEAN NOT NULL DEFAULT false,
    "disableStitch" BOOLEAN NOT NULL DEFAULT false,
    "mediaR2Key" TEXT,
    "mediaUrl" TEXT,
    "mediaMime" TEXT,
    "mediaBytes" INTEGER,
    "tiktokPublishId" TEXT,
    "tiktokShareUrl" TEXT,
    "lastError" TEXT,
    "calendarEventId" TEXT,
    "consentGivenAt" TIMESTAMP(3),
    "remindedAt" TIMESTAMP(3),
    "liveDetectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPlannerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPlannerPublishAttempt" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "rawStatus" TEXT,
    "publishId" TEXT,

    CONSTRAINT "SocialPlannerPublishAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialPlannerAccount_openId_key" ON "SocialPlannerAccount"("openId");

-- CreateIndex
CREATE INDEX "SocialPlannerAccount_connectedById_idx" ON "SocialPlannerAccount"("connectedById");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPlannerItem_calendarEventId_key" ON "SocialPlannerItem"("calendarEventId");

-- CreateIndex
CREATE INDEX "SocialPlannerItem_status_scheduledAt_idx" ON "SocialPlannerItem"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "SocialPlannerItem_accountId_status_idx" ON "SocialPlannerItem"("accountId", "status");

-- CreateIndex
CREATE INDEX "SocialPlannerItem_kind_status_idx" ON "SocialPlannerItem"("kind", "status");

-- CreateIndex
CREATE INDEX "SocialPlannerPublishAttempt_itemId_startedAt_idx" ON "SocialPlannerPublishAttempt"("itemId", "startedAt");

-- AddForeignKey
ALTER TABLE "SocialPlannerAccount" ADD CONSTRAINT "SocialPlannerAccount_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPlannerItem" ADD CONSTRAINT "SocialPlannerItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialPlannerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPlannerItem" ADD CONSTRAINT "SocialPlannerItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPlannerItem" ADD CONSTRAINT "SocialPlannerItem_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPlannerPublishAttempt" ADD CONSTRAINT "SocialPlannerPublishAttempt_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SocialPlannerItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
