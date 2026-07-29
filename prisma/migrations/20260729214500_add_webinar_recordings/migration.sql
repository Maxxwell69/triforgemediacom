-- CreateTable
CREATE TABLE "WebinarRecording" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebinarRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebinarRecording_webinarId_sortOrder_idx" ON "WebinarRecording"("webinarId", "sortOrder");

-- AddForeignKey
ALTER TABLE "WebinarRecording" ADD CONSTRAINT "WebinarRecording_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
