-- Additive migration for lesson typing.
-- Keep nullable during the legacy migration window; do not assign a default yet.

CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'FLASHCARD', 'QUIZ', 'TEXT');

ALTER TABLE "Lesson"
ADD COLUMN "lessonType" "LessonType";
