-- AlterTable
ALTER TABLE "ClientHub" ADD COLUMN "tenantDbName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClientHub_tenantDbName_key" ON "ClientHub"("tenantDbName");
