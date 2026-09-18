-- Railway DNS/TLS instructions for a Create Hub vanity hostname.
ALTER TABLE "ClientHub" ADD COLUMN "customDomainSetup" JSONB;
