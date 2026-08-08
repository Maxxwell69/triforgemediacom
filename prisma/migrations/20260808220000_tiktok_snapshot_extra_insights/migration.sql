-- AlterTable
ALTER TABLE "TikTokStatsSnapshot" ADD COLUMN "tiktokUserId" TEXT;
ALTER TABLE "TikTokStatsSnapshot" ADD COLUMN "bioLink" TEXT;
ALTER TABLE "TikTokStatsSnapshot" ADD COLUMN "bioLinkRisk" INTEGER;
ALTER TABLE "TikTokStatsSnapshot" ADD COLUMN "leagueLabel" TEXT;
ALTER TABLE "TikTokStatsSnapshot" ADD COLUMN "leagueRegion" TEXT;
ALTER TABLE "TikTokStatsSnapshot" ADD COLUMN "leagueRank" INTEGER;
