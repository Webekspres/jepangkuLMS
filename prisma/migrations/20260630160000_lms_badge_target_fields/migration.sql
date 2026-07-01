-- LmsBadge targeting fields (added to schema without migration — fixes staging Prisma crash)
ALTER TABLE "LmsBadge" ADD COLUMN IF NOT EXISTS "targetLevel" "LevelJLPT";
ALTER TABLE "LmsBadge" ADD COLUMN IF NOT EXISTS "targetCategory" "CategoryType";
ALTER TABLE "LmsBadge" ADD COLUMN IF NOT EXISTS "targetCourseId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LmsBadge_targetCourseId_fkey'
  ) THEN
    ALTER TABLE "LmsBadge"
      ADD CONSTRAINT "LmsBadge_targetCourseId_fkey"
      FOREIGN KEY ("targetCourseId") REFERENCES "Course"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
