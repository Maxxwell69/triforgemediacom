-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;

-- CreateEnum
CREATE TYPE "ShopProductKind" AS ENUM ('PHYSICAL', 'DIGITAL');

-- AlterTable
ALTER TABLE "ShopProduct" ADD COLUMN "kind" "ShopProductKind" NOT NULL DEFAULT 'PHYSICAL';

-- CreateTable
CREATE TABLE "ShopProductFile" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopProductFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopDownloadGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopDownloadGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "ShopProductFile_productId_idx" ON "ShopProductFile"("productId");

-- CreateIndex
CREATE INDEX "ShopDownloadGrant_userId_idx" ON "ShopDownloadGrant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopDownloadGrant_userId_productId_orderId_key" ON "ShopDownloadGrant"("userId", "productId", "orderId");

-- AddForeignKey
ALTER TABLE "ShopProductFile" ADD CONSTRAINT "ShopProductFile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopDownloadGrant" ADD CONSTRAINT "ShopDownloadGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopDownloadGrant" ADD CONSTRAINT "ShopDownloadGrant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopDownloadGrant" ADD CONSTRAINT "ShopDownloadGrant_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShopOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
