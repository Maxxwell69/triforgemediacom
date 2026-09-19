-- Member leave, report-to-admin, and admin archive for DMs.

ALTER TABLE "DirectConversation" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "DirectConversation" ADD COLUMN IF NOT EXISTS "archivedById" TEXT;
ALTER TABLE "DirectConversationParticipant" ADD COLUMN IF NOT EXISTS "leftAt" TIMESTAMP(3);

DO $$ BEGIN
  CREATE TYPE "DmReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "DmReport" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DmReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "DmReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DirectConversation_archivedAt_idx" ON "DirectConversation"("archivedAt");
CREATE INDEX IF NOT EXISTS "DmReport_conversationId_idx" ON "DmReport"("conversationId");
CREATE INDEX IF NOT EXISTS "DmReport_status_createdAt_idx" ON "DmReport"("status", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DirectConversation_archivedById_fkey'
  ) THEN
    ALTER TABLE "DirectConversation"
      ADD CONSTRAINT "DirectConversation_archivedById_fkey"
      FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DmReport_conversationId_fkey'
  ) THEN
    ALTER TABLE "DmReport"
      ADD CONSTRAINT "DmReport_conversationId_fkey"
      FOREIGN KEY ("conversationId") REFERENCES "DirectConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DmReport_reporterId_fkey'
  ) THEN
    ALTER TABLE "DmReport"
      ADD CONSTRAINT "DmReport_reporterId_fkey"
      FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DmReport_reviewedById_fkey'
  ) THEN
    ALTER TABLE "DmReport"
      ADD CONSTRAINT "DmReport_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Mirror onto each client hub schema.
DO $$
DECLARE s text;
BEGIN
  FOR s IN
    SELECT nspname
    FROM pg_namespace
    WHERE nspname ~ '^hub_[a-z0-9_]+$'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = s AND table_name = 'DirectConversation'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I."DirectConversation" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3)', s);
    EXECUTE format('ALTER TABLE %I."DirectConversation" ADD COLUMN IF NOT EXISTS "archivedById" TEXT', s);
    EXECUTE format('ALTER TABLE %I."DirectConversationParticipant" ADD COLUMN IF NOT EXISTS "leftAt" TIMESTAMP(3)', s);

    BEGIN
      EXECUTE format('CREATE TYPE %I."DmReportStatus" AS ENUM (''OPEN'', ''REVIEWED'', ''DISMISSED'')', s);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

DO $$
DECLARE s text;
BEGIN
  FOR s IN
    SELECT nspname
    FROM pg_namespace
    WHERE nspname ~ '^hub_[a-z0-9_]+$'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = s AND table_name = 'DirectConversation'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format($sql$
      CREATE TABLE IF NOT EXISTS %I."DmReport" (
        "id" TEXT NOT NULL,
        "conversationId" TEXT NOT NULL,
        "reporterId" TEXT NOT NULL,
        "reason" TEXT NOT NULL,
        "status" %I."DmReportStatus" NOT NULL DEFAULT 'OPEN',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reviewedAt" TIMESTAMP(3),
        "reviewedById" TEXT,
        CONSTRAINT "DmReport_pkey" PRIMARY KEY ("id")
      )
    $sql$, s, s);

    EXECUTE format('CREATE INDEX IF NOT EXISTS "DirectConversation_archivedAt_idx" ON %I."DirectConversation"("archivedAt")', s);
    EXECUTE format('CREATE INDEX IF NOT EXISTS "DmReport_conversationId_idx" ON %I."DmReport"("conversationId")', s);
    EXECUTE format('CREATE INDEX IF NOT EXISTS "DmReport_status_createdAt_idx" ON %I."DmReport"("status", "createdAt")', s);

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = s AND c.conname = 'DirectConversation_archivedById_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I."DirectConversation" ADD CONSTRAINT "DirectConversation_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES %I."User"("id") ON DELETE SET NULL ON UPDATE CASCADE',
        s, s
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = s AND c.conname = 'DmReport_conversationId_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I."DmReport" ADD CONSTRAINT "DmReport_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES %I."DirectConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE',
        s, s
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = s AND c.conname = 'DmReport_reporterId_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I."DmReport" ADD CONSTRAINT "DmReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES %I."User"("id") ON DELETE CASCADE ON UPDATE CASCADE',
        s, s
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = s AND c.conname = 'DmReport_reviewedById_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I."DmReport" ADD CONSTRAINT "DmReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES %I."User"("id") ON DELETE SET NULL ON UPDATE CASCADE',
        s, s
      );
    END IF;
  END LOOP;
END $$;
