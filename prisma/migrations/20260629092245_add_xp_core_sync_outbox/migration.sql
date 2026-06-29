-- CreateEnum
CREATE TYPE "LmsCoreSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'SKIPPED');

-- AlterTable
ALTER TABLE "LmsXpEvent" ADD COLUMN     "coreAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "coreIdempotencyKey" TEXT,
ADD COLUMN     "coreKind" TEXT,
ADD COLUMN     "coreLastError" TEXT,
ADD COLUMN     "coreStatus" "LmsCoreSyncStatus" NOT NULL DEFAULT 'SYNCED',
ADD COLUMN     "coreSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "LmsXpEvent_coreStatus_createdAt_idx" ON "LmsXpEvent"("coreStatus", "createdAt" ASC);
