-- CreateEnum
CREATE TYPE "EnrollmentLogAction" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'GRANTED', 'REVOKED');

-- CreateTable
CREATE TABLE "EnrollmentLog" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "userId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" "EnrollmentType" NOT NULL,
    "action" "EnrollmentLogAction" NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productSubtitle" TEXT,
    "studentName" TEXT,
    "actorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnrollmentLog_createdAt_idx" ON "EnrollmentLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "EnrollmentLog_userId_idx" ON "EnrollmentLog"("userId");

-- CreateIndex
CREATE INDEX "EnrollmentLog_action_idx" ON "EnrollmentLog"("action");

-- AddForeignKey
ALTER TABLE "EnrollmentLog" ADD CONSTRAINT "EnrollmentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentLog" ADD CONSTRAINT "EnrollmentLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
