-- TryoutSession must exist before QuizAttempt FK (sync_schema_staging runs later by timestamp).
CREATE TABLE IF NOT EXISTS "TryoutSession" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "phaseLabel" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "timeLimitMinutes" INTEGER NOT NULL DEFAULT 120,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TryoutSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TryoutSession_code_key" ON "TryoutSession"("code");

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
