-- LMS-local gamification: display name, points, badges (Core v2.1+ keeps XP/level only)

-- AlterTable
ALTER TABLE "User" ADD COLUMN "displayName" VARCHAR(32),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "UserLmsStats" (
    "userId" TEXT NOT NULL,
    "lmsPoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLmsStats_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "LmsPointEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointsGained" INTEGER NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsPointEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsBadge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LmsPointEvent_sourceKey_key" ON "LmsPointEvent"("sourceKey");

-- CreateIndex
CREATE INDEX "LmsPointEvent_userId_createdAt_idx" ON "LmsPointEvent"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "LmsBadge_code_key" ON "LmsBadge"("code");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- AddForeignKey
ALTER TABLE "UserLmsStats" ADD CONSTRAINT "UserLmsStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsPointEvent" ADD CONSTRAINT "LmsPointEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "LmsBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
