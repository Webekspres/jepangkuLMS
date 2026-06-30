-- Chokai ZIP import: image options, answer kind, exam progress
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "answerOptionKind" TEXT;

ALTER TABLE "QuestionOption" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

CREATE TABLE IF NOT EXISTS "TryoutExamProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tryoutSessionId" TEXT NOT NULL,
    "tryoutLevel" "LevelJLPT" NOT NULL,
    "answersJson" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryoutExamProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TryoutExamProgress_userId_tryoutSessionId_tryoutLevel_key"
    ON "TryoutExamProgress"("userId", "tryoutSessionId", "tryoutLevel");

CREATE INDEX IF NOT EXISTS "TryoutExamProgress_tryoutSessionId_tryoutLevel_idx"
    ON "TryoutExamProgress"("tryoutSessionId", "tryoutLevel");

ALTER TABLE "TryoutExamProgress" DROP CONSTRAINT IF EXISTS "TryoutExamProgress_userId_fkey";
ALTER TABLE "TryoutExamProgress" ADD CONSTRAINT "TryoutExamProgress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TryoutExamProgress" DROP CONSTRAINT IF EXISTS "TryoutExamProgress_tryoutSessionId_fkey";
ALTER TABLE "TryoutExamProgress" ADD CONSTRAINT "TryoutExamProgress_tryoutSessionId_fkey"
    FOREIGN KEY ("tryoutSessionId") REFERENCES "TryoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
