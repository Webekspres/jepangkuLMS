-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "tryoutSessionId" TEXT;
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "tryoutLevel" "LevelJLPT";
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "correctCount" INTEGER;
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "totalQuestions" INTEGER;
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "answersJson" TEXT;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_tryoutSessionId_fkey"
    FOREIGN KEY ("tryoutSessionId") REFERENCES "TryoutSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAttempt_userId_tryoutSessionId_createdAt_idx"
  ON "QuizAttempt"("userId", "tryoutSessionId", "createdAt" DESC);
