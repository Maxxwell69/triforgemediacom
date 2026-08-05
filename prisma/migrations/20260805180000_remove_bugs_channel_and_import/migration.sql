-- Remove legacy Hub Bug chat channels (messages/reads cascade).
DELETE FROM "Channel"
WHERE lower(trim(both '#' from name)) IN ('bugs', 'bug', 'bug-reports', 'bugreports');

-- Drop unused import tracking column.
DROP INDEX IF EXISTS "BugReport_sourceMessageId_key";
ALTER TABLE "BugReport" DROP COLUMN IF EXISTS "sourceMessageId";
