-- CreateEnum
CREATE TYPE "OnboardingKind" AS ENUM ('GETTING_STARTED', 'CAMPAIGN', 'CUSTOM');

-- AlterTable
ALTER TABLE "OnboardingModule" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "OnboardingModule" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Getting Started';
ALTER TABLE "OnboardingModule" ADD COLUMN "description" TEXT;
ALTER TABLE "OnboardingModule" ADD COLUMN "kind" "OnboardingKind" NOT NULL DEFAULT 'CUSTOM';
ALTER TABLE "OnboardingModule" ADD COLUMN "assignOnFirstLogin" BOOLEAN NOT NULL DEFAULT false;

UPDATE "OnboardingModule"
SET
  "title" = 'Getting Started',
  "kind" = 'GETTING_STARTED',
  "assignOnFirstLogin" = true
WHERE "id" = 'default';
