-- AlterTable
ALTER TABLE "Webinar" ADD COLUMN "externalSignupEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Webinar" ADD COLUMN "externalInviteToken" TEXT;

-- CreateTable
CREATE TABLE "WebinarGuest" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "joinToken" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "kickedAt" TIMESTAMP(3),

    CONSTRAINT "WebinarGuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Webinar_externalInviteToken_key" ON "Webinar"("externalInviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "WebinarGuest_joinToken_key" ON "WebinarGuest"("joinToken");

-- CreateIndex
CREATE INDEX "WebinarGuest_webinarId_idx" ON "WebinarGuest"("webinarId");

-- CreateIndex
CREATE UNIQUE INDEX "WebinarGuest_webinarId_email_key" ON "WebinarGuest"("webinarId", "email");

-- AddForeignKey
ALTER TABLE "WebinarGuest" ADD CONSTRAINT "WebinarGuest_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
