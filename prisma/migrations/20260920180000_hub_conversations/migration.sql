-- Staff Conversations inbox (tenant + public) and per-hub Resend BYOK (ClientHub).
ALTER TABLE "DirectConversation" ADD COLUMN IF NOT EXISTS "purpose" TEXT NOT NULL DEFAULT 'DM';
ALTER TABLE "DirectConversation" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
ALTER TABLE "DirectConversation" ADD COLUMN IF NOT EXISTS "closedById" TEXT;

CREATE INDEX IF NOT EXISTS "DirectConversation_purpose_updatedAt_idx"
  ON "DirectConversation" ("purpose", "updatedAt");
CREATE INDEX IF NOT EXISTS "DirectConversation_closedAt_idx"
  ON "DirectConversation" ("closedAt");

ALTER TABLE "DirectMessage" ADD COLUMN IF NOT EXISTS "staffSenderId" TEXT;
CREATE INDEX IF NOT EXISTS "DirectMessage_staffSenderId_idx"
  ON "DirectMessage" ("staffSenderId");

DO $$
BEGIN
  IF to_regclass('"ClientHub"') IS NOT NULL THEN
    ALTER TABLE "ClientHub" ADD COLUMN IF NOT EXISTS "resendApiKeyEnc" TEXT;
    ALTER TABLE "ClientHub" ADD COLUMN IF NOT EXISTS "resendFromEmail" TEXT;
    ALTER TABLE "ClientHub" ADD COLUMN IF NOT EXISTS "resendDomainReady" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
