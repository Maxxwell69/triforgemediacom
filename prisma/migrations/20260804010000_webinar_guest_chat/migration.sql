-- AlterTable: allow outside guests to author webinar chat messages
ALTER TABLE "WebinarChatMessage" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WebinarChatMessage" ADD COLUMN "guestId" TEXT;

-- AlterTable
ALTER TABLE "WebinarGuest" ADD COLUMN "chatMutedUntil" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WebinarChatMessage_guestId_idx" ON "WebinarChatMessage"("guestId");

-- AddForeignKey
ALTER TABLE "WebinarChatMessage" ADD CONSTRAINT "WebinarChatMessage_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "WebinarGuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
