-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "tiktokNetworkCode" TEXT,
ADD COLUMN     "tiktokNetworkRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tiktokNetworkRequestedAt" TIMESTAMP(3);
