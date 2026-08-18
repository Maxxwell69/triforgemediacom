-- CreateTable
CREATE TABLE "ClientHub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clientAdminEmail" TEXT NOT NULL,
    "enabledSkuIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "dnsCnameAt" TIMESTAMP(3),
    "railwayDomainAt" TIMESTAMP(3),
    "tenantDbAt" TIMESTAMP(3),
    "adminInvitedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "ClientHub_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientHub_slug_key" ON "ClientHub"("slug");

-- CreateIndex
CREATE INDEX "ClientHub_createdById_idx" ON "ClientHub"("createdById");

-- AddForeignKey
ALTER TABLE "ClientHub" ADD CONSTRAINT "ClientHub_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
