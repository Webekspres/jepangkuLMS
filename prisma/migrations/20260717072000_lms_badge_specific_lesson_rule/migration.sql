-- Add lesson-specific badge unlock rule and target fields.
DO $$
BEGIN
  ALTER TYPE "LmsBadgeUnlockRule" ADD VALUE 'SPECIFIC_LESSON_COMPLETE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "LmsBadge" ADD COLUMN IF NOT EXISTS "targetModuleId" TEXT;
ALTER TABLE "LmsBadge" ADD COLUMN IF NOT EXISTS "targetLessonId" TEXT;

UPDATE "LmsBadge"
SET "unlockRule" = 'TRYOUT_SCORE_THRESHOLD'
WHERE "unlockRule" = 'TRYOUT_PASS';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LmsBadge_targetModuleId_fkey'
  ) THEN
    ALTER TABLE "LmsBadge"
      ADD CONSTRAINT "LmsBadge_targetModuleId_fkey"
      FOREIGN KEY ("targetModuleId") REFERENCES "Module"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LmsBadge_targetLessonId_fkey'
  ) THEN
    ALTER TABLE "LmsBadge"
      ADD CONSTRAINT "LmsBadge_targetLessonId_fkey"
      FOREIGN KEY ("targetLessonId") REFERENCES "Lesson"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
