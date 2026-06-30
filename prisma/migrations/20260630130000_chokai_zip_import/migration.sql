-- Chokai ZIP import: image options, answer kind, exam progress (session-scoped)
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "answerOptionKind" TEXT;

ALTER TABLE "QuestionOption" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

CREATE TABLE IF NOT EXISTS "TryoutExamProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tryoutSessionId" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryoutExamProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TryoutExamProgress_userId_tryoutSessionId_key"
    ON "TryoutExamProgress"("userId", "tryoutSessionId");

CREATE INDEX IF NOT EXISTS "TryoutExamProgress_tryoutSessionId_idx"
    ON "TryoutExamProgress"("tryoutSessionId");

ALTER TABLE "TryoutExamProgress" DROP CONSTRAINT IF EXISTS "TryoutExamProgress_userId_fkey";
ALTER TABLE "TryoutExamProgress" ADD CONSTRAINT "TryoutExamProgress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TryoutExamProgress" DROP CONSTRAINT IF EXISTS "TryoutExamProgress_tryoutSessionId_fkey";
ALTER TABLE "TryoutExamProgress" ADD CONSTRAINT "TryoutExamProgress_tryoutSessionId_fkey"
    FOREIGN KEY ("tryoutSessionId") REFERENCES "TryoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ponytail: if an older dev DB created TryoutExamProgress with tryoutLevel, drop it
ALTER TABLE "TryoutExamProgress" DROP COLUMN IF EXISTS "tryoutLevel";
DROP INDEX IF EXISTS "TryoutExamProgress_userId_tryoutSessionId_tryoutLevel_key";
DROP INDEX IF EXISTS "TryoutExamProgress_tryoutSessionId_tryoutLevel_idx";
