-- CreateEnum
CREATE TYPE "BugReportPlatform" AS ENUM ('WEBSITE', 'PHONE_IOS', 'PHONE_ANDROID', 'OTHER');

-- AlterTable
ALTER TABLE "BugReport" ADD COLUMN     "platform" "BugReportPlatform" NOT NULL DEFAULT 'WEBSITE',
ADD COLUMN     "pageUrl" TEXT,
ADD COLUMN     "screenshotUrl" TEXT;
