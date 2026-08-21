UPDATE "ProgressionSettings"
SET "explainerVideoUrl" = 'https://youtu.be/QXh4TMdixP4',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'default'
  AND ("explainerVideoUrl" IS NULL OR "explainerVideoUrl" = '');
