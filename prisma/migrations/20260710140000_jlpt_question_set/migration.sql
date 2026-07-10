-- Paket Soal (JlptQuestionSet) + backfill from TryoutSessionItem

CREATE TYPE "JlptQuestionSetStatus" AS ENUM ('DRAFT', 'READY', 'ARCHIVED');

CREATE TABLE "JlptQuestionSet" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" "LevelJLPT" NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "year" INTEGER,
    "status" "JlptQuestionSetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JlptQuestionSet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JlptQuestionSet_code_key" ON "JlptQuestionSet"("code");
CREATE INDEX "JlptQuestionSet_level_status_idx" ON "JlptQuestionSet"("level", "status");

CREATE TABLE "JlptQuestionSetItem" (
    "id" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,
    "section" "TryoutSectionCode" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "jlptQuestionId" TEXT,
    "listeningStimulusId" TEXT,

    CONSTRAINT "JlptQuestionSetItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JlptQuestionSetItem_questionSetId_section_sortOrder_key"
  ON "JlptQuestionSetItem"("questionSetId", "section", "sortOrder");
CREATE INDEX "JlptQuestionSetItem_questionSetId_section_idx"
  ON "JlptQuestionSetItem"("questionSetId", "section");
CREATE INDEX "JlptQuestionSetItem_jlptQuestionId_idx" ON "JlptQuestionSetItem"("jlptQuestionId");
CREATE INDEX "JlptQuestionSetItem_listeningStimulusId_idx" ON "JlptQuestionSetItem"("listeningStimulusId");

ALTER TABLE "TryoutSession" ADD COLUMN IF NOT EXISTS "questionSetId" TEXT;

CREATE INDEX IF NOT EXISTS "TryoutSession_questionSetId_idx" ON "TryoutSession"("questionSetId");

ALTER TABLE "JlptQuestionSetItem"
  ADD CONSTRAINT "JlptQuestionSetItem_questionSetId_fkey"
  FOREIGN KEY ("questionSetId") REFERENCES "JlptQuestionSet"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JlptQuestionSetItem"
  ADD CONSTRAINT "JlptQuestionSetItem_jlptQuestionId_fkey"
  FOREIGN KEY ("jlptQuestionId") REFERENCES "JlptQuestion"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JlptQuestionSetItem"
  ADD CONSTRAINT "JlptQuestionSetItem_listeningStimulusId_fkey"
  FOREIGN KEY ("listeningStimulusId") REFERENCES "ListeningStimulus"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TryoutSession"
  ADD CONSTRAINT "TryoutSession_questionSetId_fkey"
  FOREIGN KEY ("questionSetId") REFERENCES "JlptQuestionSet"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: one package per session that has composition items
INSERT INTO "JlptQuestionSet" (
  "id", "code", "title", "level", "description", "status", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'MIG-' || ts."code",
  'Paket ' || ts."title",
  ts."level",
  'Backfill dari komposisi sesi ' || ts."code",
  'READY'::"JlptQuestionSetStatus",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "TryoutSession" ts
WHERE EXISTS (
  SELECT 1 FROM "TryoutSessionItem" i WHERE i."tryoutSessionId" = ts."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "JlptQuestionSet" qs WHERE qs."code" = 'MIG-' || ts."code"
);

UPDATE "TryoutSession" ts
SET "questionSetId" = qs."id"
FROM "JlptQuestionSet" qs
WHERE qs."code" = 'MIG-' || ts."code"
  AND ts."questionSetId" IS NULL;

INSERT INTO "JlptQuestionSetItem" (
  "id", "questionSetId", "section", "sortOrder", "jlptQuestionId", "listeningStimulusId"
)
SELECT
  gen_random_uuid()::text,
  ts."questionSetId",
  i."section",
  i."sortOrder",
  i."jlptQuestionId",
  i."listeningStimulusId"
FROM "TryoutSessionItem" i
JOIN "TryoutSession" ts ON ts."id" = i."tryoutSessionId"
WHERE ts."questionSetId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "JlptQuestionSetItem" si
    WHERE si."questionSetId" = ts."questionSetId"
      AND si."section" = i."section"
      AND si."sortOrder" = i."sortOrder"
  );
