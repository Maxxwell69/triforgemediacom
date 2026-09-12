-- CreateEnum
CREATE TYPE "OnboardingTrackScope" AS ENUM ('ALL', 'CN', 'MN');

-- CreateEnum
CREATE TYPE "OnboardingActionType" AS ENUM ('LINK', 'CONFIRM', 'COURSE_LINK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "OnboardingProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DISMISSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OnboardingLogAction" AS ENUM ('DISMISSED', 'REOPENED');

-- CreateTable
CREATE TABLE "OnboardingModule" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dismissalDisclaimerText" TEXT NOT NULL DEFAULT 'Dismissing this means you may miss required steps, including course requirements. Admins can see that you dismissed this.',
    "requiredCourseIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingStep" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "trackScope" "OnboardingTrackScope" NOT NULL DEFAULT 'ALL',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actionType" "OnboardingActionType" NOT NULL DEFAULT 'CONFIRM',
    "actionTarget" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOnboardingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" "OnboardingProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "completedStepIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dismissedAt" TIMESTAMP(3),
    "dismissedDisclaimerAccepted" BOOLEAN NOT NULL DEFAULT false,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingDismissalLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "action" "OnboardingLogAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingDismissalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingStep_moduleId_order_idx" ON "OnboardingStep"("moduleId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "UserOnboardingProgress_userId_moduleId_key" ON "UserOnboardingProgress"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "UserOnboardingProgress_status_idx" ON "UserOnboardingProgress"("status");

-- CreateIndex
CREATE INDEX "UserOnboardingProgress_moduleId_status_idx" ON "UserOnboardingProgress"("moduleId", "status");

-- CreateIndex
CREATE INDEX "OnboardingDismissalLog_userId_createdAt_idx" ON "OnboardingDismissalLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OnboardingDismissalLog_moduleId_createdAt_idx" ON "OnboardingDismissalLog"("moduleId", "createdAt");

-- AddForeignKey
ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "OnboardingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnboardingProgress" ADD CONSTRAINT "UserOnboardingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnboardingProgress" ADD CONSTRAINT "UserOnboardingProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "OnboardingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnboardingProgress" ADD CONSTRAINT "UserOnboardingProgress_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingDismissalLog" ADD CONSTRAINT "OnboardingDismissalLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingDismissalLog" ADD CONSTRAINT "OnboardingDismissalLog_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "OnboardingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
