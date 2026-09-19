CREATE TABLE IF NOT EXISTS "SiteMenuSettings" (
    "id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteMenuSettings_pkey" PRIMARY KEY ("id")
);

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
      WHERE table_schema = s AND table_name = 'User'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format($sql$
      CREATE TABLE IF NOT EXISTS %I."SiteMenuSettings" (
        "id" TEXT NOT NULL,
        "items" JSONB NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "SiteMenuSettings_pkey" PRIMARY KEY ("id")
      )
    $sql$, s);
  END LOOP;
END $$;
