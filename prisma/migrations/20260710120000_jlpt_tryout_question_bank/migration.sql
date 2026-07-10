-- JLPT Tryout Question Bank: ListeningStimulus, JlptQuestion, TryoutSessionItem
-- Expand-only + backfill from legacy Question.tryoutSessionId rows.
-- Preserves Question.id → JlptQuestion.id and QuestionOption.id so answersJson stays valid.

CREATE TYPE "TryoutSectionCode" AS ENUM ('MOJI_GOI', 'BUNPOU_DOKKAI', 'CHOKAI');
CREATE TYPE "JlptBankStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');
CREATE TYPE "JlptAnswerOptionKind" AS ENUM ('TEXT', 'IMAGE');

CREATE TABLE "ListeningStimulus" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" "LevelJLPT" NOT NULL,
    "status" "JlptBankStatus" NOT NULL DEFAULT 'ACTIVE',
    "instructionText" TEXT,
    "internalNote" TEXT,
    "audioObjectKey" TEXT,
    "audioUrl" TEXT,
    "audioDurationMs" INTEGER,
    "audioOriginalName" TEXT,
    "audioStartMs" INTEGER NOT NULL DEFAULT 0,
    "audioEndMs" INTEGER,
    "imageObjectKey" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListeningStimulus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ListeningStimulus_code_key" ON "ListeningStimulus"("code");
CREATE INDEX "ListeningStimulus_level_status_idx" ON "ListeningStimulus"("level", "status");

CREATE TABLE "JlptQuestion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" "LevelJLPT" NOT NULL,
    "section" "TryoutSectionCode" NOT NULL,
    "status" "JlptBankStatus" NOT NULL DEFAULT 'ACTIVE',
    "questionText" TEXT NOT NULL,
    "explanation" TEXT,
    "internalNote" TEXT,
    "answerOptionKind" "JlptAnswerOptionKind" NOT NULL DEFAULT 'TEXT',
    "stemImageObjectKey" TEXT,
    "stemImageUrl" TEXT,
    "listeningStimulusId" TEXT,
    "stimulusSortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JlptQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JlptQuestion_code_key" ON "JlptQuestion"("code");
CREATE INDEX "JlptQuestion_level_section_status_idx" ON "JlptQuestion"("level", "section", "status");
CREATE INDEX "JlptQuestion_listeningStimulusId_stimulusSortOrder_idx"
  ON "JlptQuestion"("listeningStimulusId", "stimulusSortOrder");

CREATE TABLE "JlptQuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "imageObjectKey" TEXT,
    "imageUrl" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JlptQuestionOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JlptQuestionOption_questionId_sortOrder_idx"
  ON "JlptQuestionOption"("questionId", "sortOrder");

CREATE TABLE "TryoutSessionItem" (
    "id" TEXT NOT NULL,
    "tryoutSessionId" TEXT NOT NULL,
    "section" "TryoutSectionCode" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "jlptQuestionId" TEXT,
    "listeningStimulusId" TEXT,

    CONSTRAINT "TryoutSessionItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TryoutSessionItem_tryoutSessionId_section_sortOrder_key"
  ON "TryoutSessionItem"("tryoutSessionId", "section", "sortOrder");
CREATE INDEX "TryoutSessionItem_tryoutSessionId_section_idx"
  ON "TryoutSessionItem"("tryoutSessionId", "section");
CREATE INDEX "TryoutSessionItem_jlptQuestionId_idx" ON "TryoutSessionItem"("jlptQuestionId");
CREATE INDEX "TryoutSessionItem_listeningStimulusId_idx" ON "TryoutSessionItem"("listeningStimulusId");

ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "paperSnapshotJson" TEXT;

ALTER TABLE "JlptQuestion"
  ADD CONSTRAINT "JlptQuestion_listeningStimulusId_fkey"
  FOREIGN KEY ("listeningStimulusId") REFERENCES "ListeningStimulus"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "JlptQuestionOption"
  ADD CONSTRAINT "JlptQuestionOption_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "JlptQuestion"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TryoutSessionItem"
  ADD CONSTRAINT "TryoutSessionItem_tryoutSessionId_fkey"
  FOREIGN KEY ("tryoutSessionId") REFERENCES "TryoutSession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TryoutSessionItem"
  ADD CONSTRAINT "TryoutSessionItem_jlptQuestionId_fkey"
  FOREIGN KEY ("jlptQuestionId") REFERENCES "JlptQuestion"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TryoutSessionItem"
  ADD CONSTRAINT "TryoutSessionItem_listeningStimulusId_fkey"
  FOREIGN KEY ("listeningStimulusId") REFERENCES "ListeningStimulus"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Backfill helpers
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE _mig_group_keys AS
SELECT
  q."tryoutSessionId" AS session_id,
  q."audioGroupId" AS group_id,
  ts."level" AS level,
  ROW_NUMBER() OVER (ORDER BY q."tryoutSessionId", q."audioGroupId") AS rn
FROM "Question" q
JOIN "TryoutSession" ts ON ts."id" = q."tryoutSessionId"
WHERE q."type" = 'TRYOUT'
  AND q."tryoutSessionId" IS NOT NULL
  AND q."audioGroupId" IS NOT NULL
  AND TRIM(q."audioGroupId") <> ''
GROUP BY q."tryoutSessionId", q."audioGroupId", ts."level";

INSERT INTO "ListeningStimulus" (
  "id", "code", "level", "status",
  "audioUrl", "audioStartMs", "imageUrl",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'MIG-' || gk.level::text || '-CH-S' || LPAD(gk.rn::text, 4, '0'),
  gk.level,
  'ACTIVE'::"JlptBankStatus",
  (
    SELECT q2."audioUrl"
    FROM "Question" q2
    WHERE q2."tryoutSessionId" = gk.session_id
      AND q2."audioGroupId" = gk.group_id
      AND q2."audioUrl" IS NOT NULL
    ORDER BY q2."sortOrder"
    LIMIT 1
  ),
  0,
  (
    SELECT q2."imageUrl"
    FROM "Question" q2
    WHERE q2."tryoutSessionId" = gk.session_id
      AND q2."audioGroupId" = gk.group_id
      AND q2."imageUrl" IS NOT NULL
    ORDER BY q2."sortOrder"
    LIMIT 1
  ),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM _mig_group_keys gk;

CREATE TEMP TABLE _mig_group_map AS
SELECT
  gk.session_id,
  gk.group_id,
  ls."id" AS stimulus_id
FROM _mig_group_keys gk
JOIN "ListeningStimulus" ls
  ON ls."code" = 'MIG-' || gk.level::text || '-CH-S' || LPAD(gk.rn::text, 4, '0');

CREATE TEMP TABLE _mig_solo_chokai AS
SELECT
  q."id" AS question_id,
  q."tryoutSessionId" AS session_id,
  ts."level" AS level,
  q."audioUrl",
  q."imageUrl",
  ROW_NUMBER() OVER (ORDER BY q."id") AS rn
FROM "Question" q
JOIN "TryoutSession" ts ON ts."id" = q."tryoutSessionId"
WHERE q."type" = 'TRYOUT'
  AND q."tryoutSection" = 'CHOKAI'
  AND (q."audioGroupId" IS NULL OR TRIM(q."audioGroupId") = '')
  AND q."audioUrl" IS NOT NULL;

INSERT INTO "ListeningStimulus" (
  "id", "code", "level", "status",
  "audioUrl", "audioStartMs", "imageUrl",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'MIG-' || sc.level::text || '-CH-Q' || LPAD(sc.rn::text, 4, '0'),
  sc.level,
  'ACTIVE'::"JlptBankStatus",
  sc."audioUrl",
  0,
  sc."imageUrl",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM _mig_solo_chokai sc;

CREATE TEMP TABLE _mig_solo_map AS
SELECT
  sc.question_id,
  ls."id" AS stimulus_id
FROM _mig_solo_chokai sc
JOIN "ListeningStimulus" ls
  ON ls."code" = 'MIG-' || sc.level::text || '-CH-Q' || LPAD(sc.rn::text, 4, '0');

INSERT INTO "JlptQuestion" (
  "id", "code", "level", "section", "status",
  "questionText", "explanation",
  "answerOptionKind", "stemImageUrl",
  "listeningStimulusId", "stimulusSortOrder",
  "createdAt", "updatedAt"
)
SELECT
  q."id",
  'MIG-' || ts."level"::text || '-' ||
    CASE
      WHEN q."tryoutSection" = 'MOJI_GOI' THEN 'MG'
      WHEN q."tryoutSection" = 'BUNPOU_DOKKAI' THEN 'BD'
      ELSE 'CH'
    END || '-' ||
    LPAD((ROW_NUMBER() OVER (
      PARTITION BY ts."level", COALESCE(q."tryoutSection", 'MOJI_GOI')
      ORDER BY q."tryoutSessionId", q."sortOrder", q."id"
    ))::text, 4, '0'),
  ts."level",
  CASE
    WHEN q."tryoutSection" = 'BUNPOU_DOKKAI' THEN 'BUNPOU_DOKKAI'::"TryoutSectionCode"
    WHEN q."tryoutSection" = 'CHOKAI' THEN 'CHOKAI'::"TryoutSectionCode"
    ELSE 'MOJI_GOI'::"TryoutSectionCode"
  END,
  'ACTIVE'::"JlptBankStatus",
  q."questionText",
  q."explanation",
  CASE
    WHEN q."answerOptionKind" = 'IMAGE' THEN 'IMAGE'::"JlptAnswerOptionKind"
    ELSE 'TEXT'::"JlptAnswerOptionKind"
  END,
  CASE
    WHEN q."tryoutSection" = 'CHOKAI' AND (
      (q."audioGroupId" IS NOT NULL AND TRIM(q."audioGroupId") <> '')
      OR q."audioUrl" IS NOT NULL
    ) THEN NULL
    ELSE q."imageUrl"
  END,
  COALESCE(
    (SELECT m.stimulus_id FROM _mig_group_map m
     WHERE m.session_id = q."tryoutSessionId" AND m.group_id = q."audioGroupId"),
    (SELECT s.stimulus_id FROM _mig_solo_map s WHERE s.question_id = q."id")
  ),
  CASE WHEN q."tryoutSection" = 'CHOKAI' THEN q."sortOrder" ELSE 0 END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Question" q
JOIN "TryoutSession" ts ON ts."id" = q."tryoutSessionId"
WHERE q."type" = 'TRYOUT'
  AND q."tryoutSessionId" IS NOT NULL;

INSERT INTO "JlptQuestionOption" (
  "id", "questionId", "text", "imageUrl", "isCorrect", "sortOrder"
)
SELECT
  o."id",
  o."questionId",
  o."text",
  o."imageUrl",
  o."isCorrect",
  (ROW_NUMBER() OVER (PARTITION BY o."questionId" ORDER BY o."id") - 1)::integer
FROM "QuestionOption" o
JOIN "JlptQuestion" jq ON jq."id" = o."questionId";

INSERT INTO "TryoutSessionItem" (
  "id", "tryoutSessionId", "section", "sortOrder", "jlptQuestionId", "listeningStimulusId"
)
SELECT
  gen_random_uuid()::text,
  q."tryoutSessionId",
  CASE
    WHEN q."tryoutSection" = 'BUNPOU_DOKKAI' THEN 'BUNPOU_DOKKAI'::"TryoutSectionCode"
    ELSE 'MOJI_GOI'::"TryoutSectionCode"
  END,
  q."sortOrder",
  q."id",
  NULL
FROM "Question" q
WHERE q."type" = 'TRYOUT'
  AND q."tryoutSessionId" IS NOT NULL
  AND COALESCE(q."tryoutSection", 'MOJI_GOI') IN ('MOJI_GOI', 'BUNPOU_DOKKAI');

INSERT INTO "TryoutSessionItem" (
  "id", "tryoutSessionId", "section", "sortOrder", "jlptQuestionId", "listeningStimulusId"
)
SELECT
  gen_random_uuid()::text,
  sub.session_id,
  'CHOKAI'::"TryoutSectionCode",
  ROW_NUMBER() OVER (PARTITION BY sub.session_id ORDER BY sub.item_order, sub.stimulus_id NULLS LAST, sub.question_id)::integer,
  CASE WHEN sub.stimulus_id IS NULL THEN sub.question_id ELSE NULL END,
  sub.stimulus_id
FROM (
  SELECT
    q."tryoutSessionId" AS session_id,
    jq."listeningStimulusId" AS stimulus_id,
    MIN(q."id") AS question_id,
    MIN(q."sortOrder") AS item_order
  FROM "Question" q
  JOIN "JlptQuestion" jq ON jq."id" = q."id"
  WHERE q."type" = 'TRYOUT'
    AND q."tryoutSection" = 'CHOKAI'
    AND q."tryoutSessionId" IS NOT NULL
  GROUP BY q."tryoutSessionId", jq."listeningStimulusId",
    CASE WHEN jq."listeningStimulusId" IS NULL THEN q."id" ELSE NULL END
) sub;
