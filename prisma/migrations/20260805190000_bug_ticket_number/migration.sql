-- CreateSequence
CREATE SEQUENCE IF NOT EXISTS "BugReport_ticketNumber_seq";

-- AlterTable
ALTER TABLE "BugReport" ADD COLUMN "ticketNumber" INTEGER;

-- Backfill existing rows in creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, id ASC) AS n
  FROM "BugReport"
)
UPDATE "BugReport" AS b
SET "ticketNumber" = numbered.n
FROM numbered
WHERE b.id = numbered.id;

-- Point sequence at current max (or 1 if empty)
SELECT setval(
  '"BugReport_ticketNumber_seq"',
  GREATEST((SELECT COALESCE(MAX("ticketNumber"), 0) FROM "BugReport"), 1),
  (SELECT COUNT(*) > 0 FROM "BugReport")
);

ALTER TABLE "BugReport" ALTER COLUMN "ticketNumber" SET NOT NULL;
ALTER TABLE "BugReport" ALTER COLUMN "ticketNumber" SET DEFAULT nextval('"BugReport_ticketNumber_seq"');
ALTER SEQUENCE "BugReport_ticketNumber_seq" OWNED BY "BugReport"."ticketNumber";

CREATE UNIQUE INDEX "BugReport_ticketNumber_key" ON "BugReport"("ticketNumber");
