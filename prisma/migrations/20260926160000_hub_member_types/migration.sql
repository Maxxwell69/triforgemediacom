-- CreateTable
CREATE TABLE "HubMemberType" (
    "id" TEXT NOT NULL,
    "key" TEXT,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "allowedMenuIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "signupDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubMemberType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HubMemberType_key_key" ON "HubMemberType"("key");

-- AlterTable
ALTER TABLE "User" ADD COLUMN "memberTypeId" TEXT;

-- AlterTable
ALTER TABLE "Webinar" ADD COLUMN "audienceMemberTypeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN "audienceMemberTypeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_memberTypeId_fkey" FOREIGN KEY ("memberTypeId") REFERENCES "HubMemberType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
