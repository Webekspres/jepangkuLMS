-- CreateEnum
CREATE TYPE "LmsBadgeRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- AlterTable
ALTER TABLE "LmsBadge" ADD COLUMN "rarity" "LmsBadgeRarity" NOT NULL DEFAULT 'COMMON';
