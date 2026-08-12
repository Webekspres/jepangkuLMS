-- Distinguish automatic rule unlocks from admin grants.
CREATE TYPE "LmsBadgeUnlockSource" AS ENUM ('RULE', 'ADMIN');

ALTER TABLE "UserBadge"
ADD COLUMN "source" "LmsBadgeUnlockSource" NOT NULL DEFAULT 'RULE';
