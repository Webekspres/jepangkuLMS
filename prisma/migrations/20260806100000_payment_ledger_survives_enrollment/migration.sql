-- Payment ledger survives enrollment delete (cancel/expire).
-- Backfill userId + product snapshot from Enrollment, then loosen FK.

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "productType" "EnrollmentType";
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "productTitle" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "productKey" TEXT;

UPDATE "Payment" AS p
SET
  "userId" = e."userId",
  "productType" = e."type",
  "productTitle" = COALESCE(c."title", lc."title", ts."title", 'Produk'),
  "productKey" = COALESCE(c."slug", lc."id", ts."code")
FROM "Enrollment" e
LEFT JOIN "Course" c ON c."id" = e."courseId"
LEFT JOIN "LiveClass" lc ON lc."id" = e."liveClassId"
LEFT JOIN "TryoutSession" ts ON ts."id" = e."tryoutSessionId"
WHERE p."enrollmentId" = e."id";

-- Orphan payments without enrollment (should not exist pre-migration) — drop if any
DELETE FROM "Payment" WHERE "userId" IS NULL OR "productType" IS NULL OR "productTitle" IS NULL;

ALTER TABLE "Payment" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "productType" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "productTitle" SET NOT NULL;

ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_enrollmentId_fkey";

ALTER TABLE "Payment" ALTER COLUMN "enrollmentId" DROP NOT NULL;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt" DESC);
