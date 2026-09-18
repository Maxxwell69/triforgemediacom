-- Hop-in voice: group toggle, per-channel flag, occupancy + WebRTC signaling.
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "grantsVoiceAccess" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "hasVoice" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "VoicePresence" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoicePresence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VoicePresence_channelId_userId_key" ON "VoicePresence"("channelId", "userId");
CREATE INDEX IF NOT EXISTS "VoicePresence_channelId_idx" ON "VoicePresence"("channelId");
CREATE INDEX IF NOT EXISTS "VoicePresence_lastSeenAt_idx" ON "VoicePresence"("lastSeenAt");

CREATE TABLE IF NOT EXISTS "VoiceSignal" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceSignal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VoiceSignal_channelId_toUserId_createdAt_idx" ON "VoiceSignal"("channelId", "toUserId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VoicePresence_channelId_fkey'
  ) THEN
    ALTER TABLE "VoicePresence"
      ADD CONSTRAINT "VoicePresence_channelId_fkey"
      FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VoicePresence_userId_fkey'
  ) THEN
    ALTER TABLE "VoicePresence"
      ADD CONSTRAINT "VoicePresence_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VoiceSignal_channelId_fkey'
  ) THEN
    ALTER TABLE "VoiceSignal"
      ADD CONSTRAINT "VoiceSignal_channelId_fkey"
      FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VoiceSignal_fromUserId_fkey'
  ) THEN
    ALTER TABLE "VoiceSignal"
      ADD CONSTRAINT "VoiceSignal_fromUserId_fkey"
      FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VoiceSignal_toUserId_fkey'
  ) THEN
    ALTER TABLE "VoiceSignal"
      ADD CONSTRAINT "VoiceSignal_toUserId_fkey"
      FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
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
      WHERE table_schema = s AND table_name = 'Channel'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I."Group" ADD COLUMN IF NOT EXISTS "grantsVoiceAccess" BOOLEAN NOT NULL DEFAULT false', s);
    EXECUTE format('ALTER TABLE %I."Channel" ADD COLUMN IF NOT EXISTS "hasVoice" BOOLEAN NOT NULL DEFAULT false', s);

    EXECUTE format($sql$
      CREATE TABLE IF NOT EXISTS %I."VoicePresence" (
        "id" TEXT NOT NULL,
        "channelId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "displayName" TEXT NOT NULL,
        "muted" BOOLEAN NOT NULL DEFAULT false,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VoicePresence_pkey" PRIMARY KEY ("id")
      )
    $sql$, s);

    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS "VoicePresence_channelId_userId_key" ON %I."VoicePresence"("channelId", "userId")', s);
    EXECUTE format('CREATE INDEX IF NOT EXISTS "VoicePresence_channelId_idx" ON %I."VoicePresence"("channelId")', s);
    EXECUTE format('CREATE INDEX IF NOT EXISTS "VoicePresence_lastSeenAt_idx" ON %I."VoicePresence"("lastSeenAt")', s);

    EXECUTE format($sql$
      CREATE TABLE IF NOT EXISTS %I."VoiceSignal" (
        "id" TEXT NOT NULL,
        "channelId" TEXT NOT NULL,
        "fromUserId" TEXT NOT NULL,
        "toUserId" TEXT NOT NULL,
        "kind" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VoiceSignal_pkey" PRIMARY KEY ("id")
      )
    $sql$, s);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS "VoiceSignal_channelId_toUserId_createdAt_idx" ON %I."VoiceSignal"("channelId", "toUserId", "createdAt")',
      s
    );

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = s AND c.conname = 'VoicePresence_channelId_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I."VoicePresence" ADD CONSTRAINT "VoicePresence_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES %I."Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE',
        s, s
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = s AND c.conname = 'VoicePresence_userId_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I."VoicePresence" ADD CONSTRAINT "VoicePresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES %I."User"("id") ON DELETE CASCADE ON UPDATE CASCADE',
        s, s
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = s AND c.conname = 'VoiceSignal_channelId_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I."VoiceSignal" ADD CONSTRAINT "VoiceSignal_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES %I."Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE',
        s, s
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = s AND c.conname = 'VoiceSignal_fromUserId_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I."VoiceSignal" ADD CONSTRAINT "VoiceSignal_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES %I."User"("id") ON DELETE CASCADE ON UPDATE CASCADE',
        s, s
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = s AND c.conname = 'VoiceSignal_toUserId_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I."VoiceSignal" ADD CONSTRAINT "VoiceSignal_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES %I."User"("id") ON DELETE CASCADE ON UPDATE CASCADE',
        s, s
      );
    END IF;
  END LOOP;
END $$;
