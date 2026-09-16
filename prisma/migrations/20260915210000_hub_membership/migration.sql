-- AlterTable
ALTER TABLE "User" ADD COLUMN "platformAccess" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "HubMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientHubId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "inviteToken" TEXT,
    "inviteTokenExpiresAt" TIMESTAMP(3),
    "tenantUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HubMembership_inviteToken_key" ON "HubMembership"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "HubMembership_userId_clientHubId_key" ON "HubMembership"("userId", "clientHubId");

-- CreateIndex
CREATE INDEX "HubMembership_clientHubId_status_idx" ON "HubMembership"("clientHubId", "status");

-- AddForeignKey
ALTER TABLE "HubMembership" ADD CONSTRAINT "HubMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMembership" ADD CONSTRAINT "HubMembership_clientHubId_fkey" FOREIGN KEY ("clientHubId") REFERENCES "ClientHub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
