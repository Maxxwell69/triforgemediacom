-- Enable My Tasks for every member; Home group can post hub calendar events;
-- weekly webinar series share seriesId.

ALTER TABLE "User" ALTER COLUMN "personalTasksEnabled" SET DEFAULT true;
UPDATE "User" SET "personalTasksEnabled" = true;

UPDATE "Group" SET "canCreateEvents" = true WHERE "isHome" = true;

ALTER TABLE "Webinar" ADD COLUMN IF NOT EXISTS "seriesId" TEXT;
CREATE INDEX IF NOT EXISTS "Webinar_seriesId_idx" ON "Webinar"("seriesId");
