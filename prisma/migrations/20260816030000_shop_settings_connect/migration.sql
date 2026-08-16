-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN "tagline" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN "supportEmail" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN "shippingCountries" TEXT NOT NULL DEFAULT 'US,CA,GB,AU';
ALTER TABLE "ShopSettings" ADD COLUMN "stripePublishableKey" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN "stripeSecretKey" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN "stripeWebhookSecret" TEXT;
