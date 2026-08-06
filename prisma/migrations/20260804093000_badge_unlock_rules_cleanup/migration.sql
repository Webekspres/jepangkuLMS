-- Retire unused unlock rules from CMS (keep enum values for PG compatibility).
UPDATE "LmsBadge"
SET
  "unlockRule" = 'MANUAL',
  "targetCategory" = NULL,
  "unlockValue" = NULL
WHERE "unlockRule" IN ('CATEGORY_COMPLETE', 'QUIZ_SCORE_THRESHOLD', 'FIRST_QUIZ');

-- First Live Class Zoom/meeting join unlock rule.
DO $$
BEGIN
  ALTER TYPE "LmsBadgeUnlockRule" ADD VALUE 'FIRST_LIVE_CLASS_JOIN';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
