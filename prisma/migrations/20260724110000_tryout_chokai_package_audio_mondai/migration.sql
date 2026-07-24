-- AlterTable
ALTER TABLE "JlptQuestion" ADD COLUMN "mondaiOrder" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "JlptQuestion_section_mondaiOrder_idx" ON "JlptQuestion"("section", "mondaiOrder");

-- AlterTable
ALTER TABLE "JlptQuestionSet" ADD COLUMN "chokaiAudioObjectKey" TEXT,
ADD COLUMN "chokaiAudioUrl" TEXT,
ADD COLUMN "chokaiAudioDurationMs" INTEGER,
ADD COLUMN "chokaiAudioOriginalName" TEXT;
