-- Groups Phase B: enroll ACTIVE users into Home; attach ungrouped MEMBER channels to Home.

-- Ensure Home exists (idempotent with scaffold seed id)
INSERT INTO "Group" ("id", "name", "description", "color", "grantsTikTaskAccess", "isHome", "joinMode", "createdAt", "updatedAt")
SELECT
  'home_group_system',
  'Home',
  'Main hub space — default community channels live here.',
  '#FD4802',
  true,
  true,
  'CLOSED',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Group" WHERE "isHome" = true);

-- Enroll every ACTIVE user into Home (skipDuplicates via unique constraint)
INSERT INTO "GroupMember" ("id", "userId", "groupId", "role", "addedAt")
SELECT
  md5(random()::text || clock_timestamp()::text || u."id")::text,
  u."id",
  g."id",
  'MEMBER',
  CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN "Group" g
WHERE u."status" = 'ACTIVE'
  AND g."isHome" = true
  AND NOT EXISTS (
    SELECT 1 FROM "GroupMember" gm
    WHERE gm."userId" = u."id" AND gm."groupId" = g."id"
  );

-- Attach currently ungrouped MEMBER channels to Home (main hub channel list)
INSERT INTO "_ChannelGroups" ("A", "B")
SELECT c."id", g."id"
FROM "Channel" c
CROSS JOIN "Group" g
WHERE g."isHome" = true
  AND c."minRole" = 'MEMBER'
  AND NOT EXISTS (
    SELECT 1 FROM "_ChannelGroups" cg WHERE cg."A" = c."id"
  )
ON CONFLICT DO NOTHING;
