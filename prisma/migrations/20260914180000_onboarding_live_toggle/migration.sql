-- CreateTable
CREATE TABLE "OnboardingSettings" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingSettings_pkey" PRIMARY KEY ("id")
);

-- Seed inactive so production can set up checklists before members see them.
INSERT INTO "OnboardingSettings" ("id", "active", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP);
