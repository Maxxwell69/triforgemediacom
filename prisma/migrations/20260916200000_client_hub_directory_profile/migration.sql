-- Hub directory profile (control-plane ClientHub only — not copied into tenant schemas).
ALTER TABLE "ClientHub" ADD COLUMN "directoryPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ClientHub" ADD COLUMN "directoryDescription" TEXT;
ALTER TABLE "ClientHub" ADD COLUMN "directoryImageUrl" TEXT;

-- Keep hubs that are already provisioned visible on /hubs until an admin turns them private.
UPDATE "ClientHub" SET "directoryPublic" = true WHERE "tenantDbAt" IS NOT NULL;
