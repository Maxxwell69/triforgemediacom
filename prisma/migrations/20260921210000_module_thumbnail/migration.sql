ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;

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
      WHERE table_schema = s AND table_name = 'Module'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE %I."Module" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT',
      s
    );
  END LOOP;
END $$;
