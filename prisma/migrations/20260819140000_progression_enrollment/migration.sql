-- AlterTable
ALTER TABLE "ProgressionProfile" ADD COLUMN "enrolledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProgressionSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "memberVisible" BOOLEAN NOT NULL DEFAULT false,
    "explainerVideoUrl" TEXT,
    "explainerHeadline" TEXT NOT NULL DEFAULT 'Creator Progression',
    "explainerBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "ProgressionApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProgressionApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "whyJoin" TEXT NOT NULL,
    "goals" TEXT,
    "status" "ProgressionApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressionApplication_userId_key" ON "ProgressionApplication"("userId");

-- CreateIndex
CREATE INDEX "ProgressionApplication_status_createdAt_idx" ON "ProgressionApplication"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ProgressionApplication" ADD CONSTRAINT "ProgressionApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionApplication" ADD CONSTRAINT "ProgressionApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
