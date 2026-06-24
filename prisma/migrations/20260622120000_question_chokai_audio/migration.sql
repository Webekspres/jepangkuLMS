-- AlterTable
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "audioGroupId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Question_audioGroupId_idx" ON "Question"("audioGroupId");
