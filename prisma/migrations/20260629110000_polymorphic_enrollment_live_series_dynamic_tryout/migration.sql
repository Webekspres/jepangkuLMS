-- CreateEnum
CREATE TYPE "EnrollmentType" AS ENUM ('COURSE', 'LIVE_CLASS', 'TRYOUT');

-- DropIndex
DROP INDEX "LiveClass_isPublished_scheduledAt_idx";

-- DropIndex
DROP INDEX "LiveClass_scheduledAt_idx";

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "liveClassId" TEXT,
ADD COLUMN     "tryoutSessionId" TEXT,
ADD COLUMN     "type" "EnrollmentType" NOT NULL DEFAULT 'COURSE',
ALTER COLUMN "courseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClass" DROP COLUMN "endsAt",
DROP COLUMN "meetingUrl",
DROP COLUMN "scheduledAt",
ADD COLUMN     "priceIdr" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TryoutSession" ADD COLUMN     "isStrictTimeBound" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "priceIdr" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LiveClassSession" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "meetingUrl" TEXT,
    "recordingUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveClassSession_liveClassId_scheduledAt_idx" ON "LiveClassSession"("liveClassId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Enrollment_userId_type_idx" ON "Enrollment"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_liveClassId_key" ON "Enrollment"("userId", "liveClassId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_tryoutSessionId_key" ON "Enrollment"("userId", "tryoutSessionId");

-- CreateIndex
CREATE INDEX "LiveClass_isPublished_idx" ON "LiveClass"("isPublished");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "LiveClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_tryoutSessionId_fkey" FOREIGN KEY ("tryoutSessionId") REFERENCES "TryoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassSession" ADD CONSTRAINT "LiveClassSession_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "LiveClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
