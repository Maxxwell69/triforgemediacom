-- CreateEnum
CREATE TYPE "BookingDateOverrideKind" AS ENUM ('CLOSED', 'CUSTOM');

-- CreateTable
CREATE TABLE "BookingDateOverride" (
    "id" TEXT NOT NULL,
    "bookingPageId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "kind" "BookingDateOverrideKind" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDateOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingDateOverrideWindow" (
    "id" TEXT NOT NULL,
    "overrideId" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "BookingDateOverrideWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingDateOverride_bookingPageId_localDate_key" ON "BookingDateOverride"("bookingPageId", "localDate");

-- CreateIndex
CREATE INDEX "BookingDateOverride_bookingPageId_localDate_idx" ON "BookingDateOverride"("bookingPageId", "localDate");

-- CreateIndex
CREATE INDEX "BookingDateOverrideWindow_overrideId_idx" ON "BookingDateOverrideWindow"("overrideId");

-- AddForeignKey
ALTER TABLE "BookingDateOverride" ADD CONSTRAINT "BookingDateOverride_bookingPageId_fkey" FOREIGN KEY ("bookingPageId") REFERENCES "BookingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDateOverrideWindow" ADD CONSTRAINT "BookingDateOverrideWindow_overrideId_fkey" FOREIGN KEY ("overrideId") REFERENCES "BookingDateOverride"("id") ON DELETE CASCADE ON UPDATE CASCADE;
