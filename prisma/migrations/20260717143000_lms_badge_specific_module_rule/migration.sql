-- Add module-specific badge unlock rule.
DO $$
BEGIN
  ALTER TYPE "LmsBadgeUnlockRule" ADD VALUE 'SPECIFIC_MODULE_COMPLETE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
