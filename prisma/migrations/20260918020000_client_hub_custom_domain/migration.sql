-- Optional vanity hostname for a Create Hub (control-plane ClientHub).
ALTER TABLE "ClientHub" ADD COLUMN "customDomain" TEXT;
CREATE UNIQUE INDEX "ClientHub_customDomain_key" ON "ClientHub"("customDomain");
