-- AlterTable
ALTER TABLE "BookingPage" ADD COLUMN "remindHourBefore" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "cancelToken" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "remindHourBefore" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Appointment" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- Backfill unique cancel tokens for existing appointments
UPDATE "Appointment"
SET "cancelToken" = md5(random()::text || id || clock_timestamp()::text)
WHERE "cancelToken" IS NULL;

ALTER TABLE "Appointment" ALTER COLUMN "cancelToken" SET NOT NULL;

CREATE UNIQUE INDEX "Appointment_cancelToken_key" ON "Appointment"("cancelToken");
