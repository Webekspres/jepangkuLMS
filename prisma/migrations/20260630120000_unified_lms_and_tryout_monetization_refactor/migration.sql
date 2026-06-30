-- CreateEnum
CREATE TYPE "CourseCategoryType" AS ENUM ('KURSUS_UTAMA', 'KURSUS_GRATIS', 'KURSUS_TAMBAHAN');

-- Course: string category → CourseCategoryType
ALTER TABLE "Course" ADD COLUMN "category_new" "CourseCategoryType" NOT NULL DEFAULT 'KURSUS_UTAMA';

UPDATE "Course" SET "category_new" = 'KURSUS_GRATIS' WHERE "priceIdr" = 0;

ALTER TABLE "Course" DROP COLUMN "category";
ALTER TABLE "Course" RENAME COLUMN "category_new" TO "category";

-- TryoutSession: lock each session to one JLPT level
ALTER TABLE "TryoutSession" ADD COLUMN "level" "LevelJLPT" NOT NULL DEFAULT 'N5';

UPDATE "TryoutSession" ts
SET "level" = COALESCE(
  (
    SELECT q."tryoutLevel"
    FROM "Question" q
    WHERE q."tryoutSessionId" = ts.id
      AND q."tryoutLevel" IS NOT NULL
      AND q."type" = 'TRYOUT'
    GROUP BY q."tryoutLevel"
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  'N5'::"LevelJLPT"
);

-- Question: level inherited from session
DROP INDEX IF EXISTS "Question_tryoutSessionId_tryoutLevel_sortOrder_idx";

ALTER TABLE "Question" DROP COLUMN "tryoutLevel";

CREATE INDEX "Question_tryoutSessionId_sortOrder_idx" ON "Question"("tryoutSessionId", "sortOrder");
