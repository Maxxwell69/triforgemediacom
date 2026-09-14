-- AlterTable
ALTER TABLE "OnboardingModule" ADD COLUMN "allowedMenuIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
