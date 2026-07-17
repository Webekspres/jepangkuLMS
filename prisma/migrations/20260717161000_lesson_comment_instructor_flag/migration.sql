-- Root lesson comments: persist instructor badge like replies.
ALTER TABLE "LessonComment" ADD COLUMN "isInstructor" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing root comments authored by LMS admins.
UPDATE "LessonComment" AS c
SET "isInstructor" = true
FROM "User" AS u
WHERE c."userId" = u.id
  AND u.role = 'LMS_ADMIN';
