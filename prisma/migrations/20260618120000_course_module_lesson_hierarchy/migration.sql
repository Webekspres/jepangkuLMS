-- Course → Module → Lesson hierarchy
-- Migrates existing lessons from courseId to moduleId via a temporary legacy module per course.

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- Add nullable moduleId before backfill
ALTER TABLE "Lesson" ADD COLUMN "moduleId" TEXT;

-- Legacy module per course that still has lessons (seed will replace with real N5 modules)
INSERT INTO "Module" ("id", "courseId", "title", "slug", "order", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    c."id",
    'Modul Utama',
    'legacy',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Course" c
WHERE EXISTS (SELECT 1 FROM "Lesson" l WHERE l."courseId" = c."id");

UPDATE "Lesson" l
SET "moduleId" = m."id"
FROM "Module" m
WHERE m."courseId" = l."courseId" AND m."slug" = 'legacy';

-- Drop old FK and column
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_courseId_fkey";
ALTER TABLE "Lesson" DROP COLUMN "courseId";

-- moduleId required + new FK
ALTER TABLE "Lesson" ALTER COLUMN "moduleId" SET NOT NULL;

-- Indexes & constraints
CREATE UNIQUE INDEX "Module_courseId_slug_key" ON "Module"("courseId", "slug");
CREATE UNIQUE INDEX "Module_courseId_order_key" ON "Module"("courseId", "order");
CREATE INDEX "Module_courseId_idx" ON "Module"("courseId");

CREATE UNIQUE INDEX "Lesson_moduleId_slug_key" ON "Lesson"("moduleId", "slug");
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
