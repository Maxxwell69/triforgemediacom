-- CreateEnum
CREATE TYPE "WebinarStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "WebinarParticipantRole" AS ENUM ('HOST', 'SPEAKER', 'AUDIENCE');

-- CreateEnum
CREATE TYPE "StageRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "Webinar" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "WebinarStatus" NOT NULL DEFAULT 'DRAFT',
    "hostUserId" TEXT NOT NULL,
    "livekitRoomName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webinar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebinarAttendance" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WebinarParticipantRole" NOT NULL DEFAULT 'AUDIENCE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "WebinarAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebinarChatMessage" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebinarChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebinarStageRequest" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "StageRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WebinarStageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Webinar_livekitRoomName_key" ON "Webinar"("livekitRoomName");

-- CreateIndex
CREATE INDEX "Webinar_status_scheduledAt_idx" ON "Webinar"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "WebinarAttendance_webinarId_idx" ON "WebinarAttendance"("webinarId");

-- CreateIndex
CREATE UNIQUE INDEX "WebinarAttendance_webinarId_userId_key" ON "WebinarAttendance"("webinarId", "userId");

-- CreateIndex
CREATE INDEX "WebinarChatMessage_webinarId_createdAt_idx" ON "WebinarChatMessage"("webinarId", "createdAt");

-- CreateIndex
CREATE INDEX "WebinarStageRequest_webinarId_status_idx" ON "WebinarStageRequest"("webinarId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WebinarStageRequest_webinarId_userId_key" ON "WebinarStageRequest"("webinarId", "userId");

-- AddForeignKey
ALTER TABLE "Webinar" ADD CONSTRAINT "Webinar_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarAttendance" ADD CONSTRAINT "WebinarAttendance_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarAttendance" ADD CONSTRAINT "WebinarAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarChatMessage" ADD CONSTRAINT "WebinarChatMessage_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarChatMessage" ADD CONSTRAINT "WebinarChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarStageRequest" ADD CONSTRAINT "WebinarStageRequest_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarStageRequest" ADD CONSTRAINT "WebinarStageRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
