-- Calendly-style staff booking pages + appointments

CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

CREATE TABLE "BookingPage" (
    "id" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Book a meeting',
    "description" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "bufferMins" INTEGER NOT NULL DEFAULT 0,
    "aheadDays" INTEGER NOT NULL DEFAULT 14,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingPage_hostUserId_key" ON "BookingPage"("hostUserId");
CREATE UNIQUE INDEX "BookingPage_slug_key" ON "BookingPage"("slug");

ALTER TABLE "BookingPage" ADD CONSTRAINT "BookingPage_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BookingWeeklyWindow" (
    "id" TEXT NOT NULL,
    "bookingPageId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "BookingWeeklyWindow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingWeeklyWindow_bookingPageId_dayOfWeek_idx" ON "BookingWeeklyWindow"("bookingPageId", "dayOfWeek");

ALTER TABLE "BookingWeeklyWindow" ADD CONSTRAINT "BookingWeeklyWindow_bookingPageId_fkey" FOREIGN KEY ("bookingPageId") REFERENCES "BookingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "bookingPageId" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "bookerName" TEXT NOT NULL,
    "bookerEmail" TEXT NOT NULL,
    "notes" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "webinarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Appointment_webinarId_key" ON "Appointment"("webinarId");
CREATE INDEX "Appointment_hostUserId_startsAt_idx" ON "Appointment"("hostUserId", "startsAt");
CREATE INDEX "Appointment_bookingPageId_startsAt_idx" ON "Appointment"("bookingPageId", "startsAt");
CREATE INDEX "Appointment_bookerEmail_idx" ON "Appointment"("bookerEmail");

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_bookingPageId_fkey" FOREIGN KEY ("bookingPageId") REFERENCES "BookingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
