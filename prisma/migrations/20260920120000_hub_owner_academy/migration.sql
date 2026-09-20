ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "hubOwnerOnly" BOOLEAN NOT NULL DEFAULT false;

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
      WHERE table_schema = s AND table_name = 'Course'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE %I."Course" ADD COLUMN IF NOT EXISTS "hubOwnerOnly" BOOLEAN NOT NULL DEFAULT false',
      s
    );
  END LOOP;
END $$;
