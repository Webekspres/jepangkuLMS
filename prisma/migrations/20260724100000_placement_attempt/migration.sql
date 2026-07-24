-- CreateTable
CREATE TABLE "PlacementAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "paperVersion" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "recommendedLevel" "LevelJLPT" NOT NULL,
    "answersJson" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlacementAttempt_userId_completedAt_idx" ON "PlacementAttempt"("userId", "completedAt" DESC);

-- AddForeignKey
ALTER TABLE "PlacementAttempt" ADD CONSTRAINT "PlacementAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
