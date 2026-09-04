-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "meetingTypeId" TEXT;

-- CreateTable
CREATE TABLE "BookingMeetingType" (
    "id" TEXT NOT NULL,
    "bookingPageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMins" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingMeetingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingOpenSlot" (
    "id" TEXT NOT NULL,
    "bookingPageId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingOpenSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingMeetingType_bookingPageId_sortOrder_idx" ON "BookingMeetingType"("bookingPageId", "sortOrder");

-- CreateIndex
CREATE INDEX "BookingOpenSlot_bookingPageId_startsAt_idx" ON "BookingOpenSlot"("bookingPageId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_meetingTypeId_idx" ON "Appointment"("meetingTypeId");

-- AddForeignKey
ALTER TABLE "BookingMeetingType" ADD CONSTRAINT "BookingMeetingType_bookingPageId_fkey" FOREIGN KEY ("bookingPageId") REFERENCES "BookingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingOpenSlot" ADD CONSTRAINT "BookingOpenSlot_bookingPageId_fkey" FOREIGN KEY ("bookingPageId") REFERENCES "BookingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_meetingTypeId_fkey" FOREIGN KEY ("meetingTypeId") REFERENCES "BookingMeetingType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
