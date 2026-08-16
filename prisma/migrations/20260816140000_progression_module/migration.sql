-- CreateEnum
CREATE TYPE "ProgressionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "ProgressionRecurrence" AS ENUM ('ONE_TIME', 'REPEATABLE', 'DAILY', 'WEEKLY');
CREATE TYPE "ProgressionUnlockKind" AS ENUM ('QUIZ_PASSED', 'CATEGORY_XP', 'ADMIN_REVIEW');
CREATE TYPE "ProgressionSkillUnlockKind" AS ENUM ('MANUAL', 'LEVEL', 'CATEGORY_XP', 'CERTIFICATION');
CREATE TYPE "ProgressionBadgeTrigger" AS ENUM ('LEVEL', 'MISSION', 'CERTIFICATION', 'SKILL', 'STANDALONE');

-- CreateTable
CREATE TABLE "ProgressionCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgressionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "xpRequired" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgressionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionLevel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionMission" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "xpValue" INTEGER NOT NULL DEFAULT 0,
    "recurrence" "ProgressionRecurrence" NOT NULL DEFAULT 'ONE_TIME',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgressionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionMission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionLevelMilestone" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    CONSTRAINT "ProgressionLevelMilestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionLearningModule" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "videoUrl" TEXT,
    "linkUrl" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgressionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionLearningModule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionQuiz" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "passThreshold" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionQuiz_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionQuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProgressionQuizQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionCertification" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgressionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionCertification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionLevelCertReq" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    CONSTRAINT "ProgressionLevelCertReq_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionCertTier" (
    "id" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "unlockKind" "ProgressionUnlockKind" NOT NULL DEFAULT 'CATEGORY_XP',
    "xpRequired" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionCertTier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionSkill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgressionStatus" NOT NULL DEFAULT 'DRAFT',
    "unlockKind" "ProgressionSkillUnlockKind" NOT NULL DEFAULT 'MANUAL',
    "levelId" TEXT,
    "categoryId" TEXT,
    "certificationId" TEXT,
    "xpRequired" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionSkill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionBadge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "trigger" "ProgressionBadgeTrigger" NOT NULL DEFAULT 'STANDALONE',
    "triggerId" TEXT,
    "status" "ProgressionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionBadge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentLevelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionCategoryXp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgressionCategoryXp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionMissionCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressionMissionCompletion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionModuleCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressionModuleCompletion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionQuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressionQuizAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionCertificationHeld" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressionCertificationHeld_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionSkillUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressionSkillUnlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressionBadgeGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressionBadgeGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgressionLevelMilestone_levelId_missionId_key" ON "ProgressionLevelMilestone"("levelId", "missionId");
CREATE UNIQUE INDEX "ProgressionQuiz_moduleId_key" ON "ProgressionQuiz"("moduleId");
CREATE INDEX "ProgressionQuizQuestion_quizId_sortOrder_idx" ON "ProgressionQuizQuestion"("quizId", "sortOrder");
CREATE UNIQUE INDEX "ProgressionLevelCertReq_levelId_certificationId_key" ON "ProgressionLevelCertReq"("levelId", "certificationId");
CREATE INDEX "ProgressionCertTier_certificationId_sortOrder_idx" ON "ProgressionCertTier"("certificationId", "sortOrder");
CREATE UNIQUE INDEX "ProgressionProfile_userId_key" ON "ProgressionProfile"("userId");
CREATE UNIQUE INDEX "ProgressionCategoryXp_userId_categoryId_key" ON "ProgressionCategoryXp"("userId", "categoryId");
CREATE INDEX "ProgressionMissionCompletion_userId_missionId_idx" ON "ProgressionMissionCompletion"("userId", "missionId");
CREATE UNIQUE INDEX "ProgressionModuleCompletion_userId_moduleId_key" ON "ProgressionModuleCompletion"("userId", "moduleId");
CREATE INDEX "ProgressionQuizAttempt_userId_quizId_idx" ON "ProgressionQuizAttempt"("userId", "quizId");
CREATE UNIQUE INDEX "ProgressionCertificationHeld_userId_certificationId_key" ON "ProgressionCertificationHeld"("userId", "certificationId");
CREATE UNIQUE INDEX "ProgressionSkillUnlock_userId_skillId_key" ON "ProgressionSkillUnlock"("userId", "skillId");
CREATE UNIQUE INDEX "ProgressionBadgeGrant_userId_badgeId_key" ON "ProgressionBadgeGrant"("userId", "badgeId");

ALTER TABLE "ProgressionMission" ADD CONSTRAINT "ProgressionMission_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProgressionCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionLevelMilestone" ADD CONSTRAINT "ProgressionLevelMilestone_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "ProgressionLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionLevelMilestone" ADD CONSTRAINT "ProgressionLevelMilestone_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "ProgressionMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionLearningModule" ADD CONSTRAINT "ProgressionLearningModule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProgressionCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionQuiz" ADD CONSTRAINT "ProgressionQuiz_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ProgressionLearningModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionQuizQuestion" ADD CONSTRAINT "ProgressionQuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "ProgressionQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionCertification" ADD CONSTRAINT "ProgressionCertification_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProgressionCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionLevelCertReq" ADD CONSTRAINT "ProgressionLevelCertReq_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "ProgressionLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionLevelCertReq" ADD CONSTRAINT "ProgressionLevelCertReq_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "ProgressionCertification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionCertTier" ADD CONSTRAINT "ProgressionCertTier_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "ProgressionCertification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionSkill" ADD CONSTRAINT "ProgressionSkill_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "ProgressionLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProgressionSkill" ADD CONSTRAINT "ProgressionSkill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProgressionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProgressionSkill" ADD CONSTRAINT "ProgressionSkill_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "ProgressionCertification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProgressionProfile" ADD CONSTRAINT "ProgressionProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionProfile" ADD CONSTRAINT "ProgressionProfile_currentLevelId_fkey" FOREIGN KEY ("currentLevelId") REFERENCES "ProgressionLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProgressionCategoryXp" ADD CONSTRAINT "ProgressionCategoryXp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionCategoryXp" ADD CONSTRAINT "ProgressionCategoryXp_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProgressionCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionMissionCompletion" ADD CONSTRAINT "ProgressionMissionCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionMissionCompletion" ADD CONSTRAINT "ProgressionMissionCompletion_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "ProgressionMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionModuleCompletion" ADD CONSTRAINT "ProgressionModuleCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionModuleCompletion" ADD CONSTRAINT "ProgressionModuleCompletion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ProgressionLearningModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionQuizAttempt" ADD CONSTRAINT "ProgressionQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionQuizAttempt" ADD CONSTRAINT "ProgressionQuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "ProgressionQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionCertificationHeld" ADD CONSTRAINT "ProgressionCertificationHeld_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionCertificationHeld" ADD CONSTRAINT "ProgressionCertificationHeld_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "ProgressionCertification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionCertificationHeld" ADD CONSTRAINT "ProgressionCertificationHeld_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "ProgressionCertTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionCertificationHeld" ADD CONSTRAINT "ProgressionCertificationHeld_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProgressionSkillUnlock" ADD CONSTRAINT "ProgressionSkillUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionSkillUnlock" ADD CONSTRAINT "ProgressionSkillUnlock_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "ProgressionSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionBadgeGrant" ADD CONSTRAINT "ProgressionBadgeGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionBadgeGrant" ADD CONSTRAINT "ProgressionBadgeGrant_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "ProgressionBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
