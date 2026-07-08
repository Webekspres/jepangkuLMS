-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LmsBadgeUnlockRule" ADD VALUE 'QUIZ_SCORE_THRESHOLD';
ALTER TYPE "LmsBadgeUnlockRule" ADD VALUE 'CATEGORY_COMPLETE';
ALTER TYPE "LmsBadgeUnlockRule" ADD VALUE 'TRYOUT_SCORE_THRESHOLD';
ALTER TYPE "LmsBadgeUnlockRule" ADD VALUE 'SPECIFIC_COURSE_COMPLETE';

-- AlterTable
ALTER TABLE "LiveClass" ADD COLUMN     "paymentLink" TEXT;

-- AlterTable
ALTER TABLE "MaterialKanji" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MaterialKosakata" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MaterialTataBahasa" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
