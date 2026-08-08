-- Set TriForge company TikTok to the official CN live account.
INSERT INTO "CompanySocial" ("id", "platform", "url", "updatedAt")
VALUES (
  'cm_company_tiktok_forge_live_cn',
  'TIKTOK',
  'https://www.tiktok.com/@forge_live_cn',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("platform") DO UPDATE SET
  "url" = EXCLUDED."url",
  "updatedAt" = CURRENT_TIMESTAMP;
