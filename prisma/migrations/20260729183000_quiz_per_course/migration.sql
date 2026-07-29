-- Move quizzes from lessons to courses (one quiz per course).

-- 1. Add courseId
ALTER TABLE "Quiz" ADD COLUMN "courseId" TEXT;

-- 2. Backfill from the lesson's course
UPDATE "Quiz" q
SET "courseId" = l."courseId"
FROM "Lesson" l
WHERE q."lessonId" = l."id";

-- 3. If a course somehow has multiple lesson quizzes, keep one (most questions, then oldest)
WITH ranked AS (
  SELECT
    q."id",
    q."courseId",
    ROW_NUMBER() OVER (
      PARTITION BY q."courseId"
      ORDER BY (SELECT COUNT(*) FROM "Question" qu WHERE qu."quizId" = q."id") DESC, q."createdAt" ASC
    ) AS rn
  FROM "Quiz" q
  WHERE q."courseId" IS NOT NULL
)
DELETE FROM "Quiz"
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);

-- 4. Drop orphan quizzes that couldn't be mapped
DELETE FROM "Quiz" WHERE "courseId" IS NULL;

-- 5. Swap FK: drop lesson relation, enforce course relation
ALTER TABLE "Quiz" DROP CONSTRAINT IF EXISTS "Quiz_lessonId_fkey";
DROP INDEX IF EXISTS "Quiz_lessonId_key";
ALTER TABLE "Quiz" DROP COLUMN "lessonId";

ALTER TABLE "Quiz" ALTER COLUMN "courseId" SET NOT NULL;
CREATE UNIQUE INDEX "Quiz_courseId_key" ON "Quiz"("courseId");
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
