-- SSO display name fallback + first-login setup tracking

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ssoDisplayName" VARCHAR(64);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayNameSetupAt" TIMESTAMP(3);

-- Legacy users who already chose a display name are treated as onboarded
UPDATE "User"
SET "displayNameSetupAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE "displayName" IS NOT NULL
  AND TRIM("displayName") <> ''
  AND "displayNameSetupAt" IS NULL;
