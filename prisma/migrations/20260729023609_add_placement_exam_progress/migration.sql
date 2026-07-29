-- CreateTable
CREATE TABLE "PlacementExamProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "paperVersion" INTEGER NOT NULL,
    "progressJson" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementExamProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlacementExamProgress_userId_updatedAt_idx" ON "PlacementExamProgress"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PlacementExamProgress_userId_paperId_key" ON "PlacementExamProgress"("userId", "paperId");

-- AddForeignKey
ALTER TABLE "PlacementExamProgress" ADD CONSTRAINT "PlacementExamProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
