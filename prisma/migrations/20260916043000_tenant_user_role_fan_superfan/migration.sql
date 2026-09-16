-- Fan/Superfan were added on Hub 0 `public`. Each client hub has its own
-- schema-local UserRole enum from provision-time migrate deploy.
DO $$
DECLARE s text;
BEGIN
  FOR s IN
    SELECT nspname
    FROM pg_namespace
    WHERE nspname ~ '^hub_[a-z0-9_]+$'
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = s AND t.typname = 'UserRole'
    ) THEN
      EXECUTE format('ALTER TYPE %I."UserRole" ADD VALUE IF NOT EXISTS %L', s, 'SUPERFAN');
      EXECUTE format('ALTER TYPE %I."UserRole" ADD VALUE IF NOT EXISTS %L', s, 'FAN');
    END IF;
  END LOOP;
END $$;
