-- CreateEnum
CREATE TYPE "GhlImportStatus" AS ENUM ('PENDING', 'INVITED', 'CONFIRMED', 'DECLINED');

-- CreateTable
CREATE TABLE "GhlImport" (
    "id" TEXT NOT NULL,
    "ghlContactId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "tagsRaw" TEXT,
    "status" "GhlImportStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "GhlImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GhlImport_ghlContactId_key" ON "GhlImport"("ghlContactId");

-- CreateIndex
CREATE UNIQUE INDEX "GhlImport_userId_key" ON "GhlImport"("userId");

-- AddForeignKey
ALTER TABLE "GhlImport" ADD CONSTRAINT "GhlImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
