-- Sync Prisma schema with migrations (staging uses migrate deploy; dev often used db push).
-- Fixes RSC errors on /kursus (Course.category, Course.isFeatured) and other data pages.

-- Enums
DO $$ BEGIN
  CREATE TYPE "LmsRole" AS ENUM ('LMS_STUDENT', 'LMS_ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LmsBadgeUnlockRule" AS ENUM ('MANUAL', 'FIRST_LESSON', 'FIRST_QUIZ', 'TRYOUT_PASS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LmsNotificationType" AS ENUM (
    'ENROLLMENT_PENDING',
    'ENROLLMENT_APPROVED',
    'ENROLLMENT_REJECTED',
    'BADGE_UNLOCKED',
    'XP_EARNED',
    'COURSE_GRANTED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Course catalog (required by getCachedCoursesWithDbIds on /kursus)
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Kosa Kata';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- User profile & roles
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" VARCHAR(280);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "LmsRole" NOT NULL DEFAULT 'LMS_STUDENT';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "equippedBadgeId" TEXT;

-- LmsBadge unlock metadata
ALTER TABLE "LmsBadge" ADD COLUMN IF NOT EXISTS "unlockRule" "LmsBadgeUnlockRule" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "LmsBadge" ADD COLUMN IF NOT EXISTS "unlockValue" INTEGER;
ALTER TABLE "LmsBadge" ADD COLUMN IF NOT EXISTS "xpBonus" INTEGER NOT NULL DEFAULT 25;
ALTER TABLE "LmsBadge" ADD COLUMN IF NOT EXISTS "requirementText" TEXT;

-- UserBadge
ALTER TABLE "UserBadge" ADD COLUMN IF NOT EXISTS "xpBonusAwarded" BOOLEAN NOT NULL DEFAULT false;

-- Question tryout fields
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "tryoutSessionId" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "tryoutLevel" "LevelJLPT";
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "tryoutSection" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- LmsXpEvent (dashboard weekly XP chart)
CREATE TABLE IF NOT EXISTS "LmsXpEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xpGained" INTEGER NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LmsXpEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LmsXpEvent_sourceKey_key" ON "LmsXpEvent"("sourceKey");
CREATE INDEX IF NOT EXISTS "LmsXpEvent_userId_createdAt_idx" ON "LmsXpEvent"("userId", "createdAt" DESC);

DO $$ BEGIN
  ALTER TABLE "LmsXpEvent" ADD CONSTRAINT "LmsXpEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- LmsNotification
CREATE TABLE IF NOT EXISTS "LmsNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LmsNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LmsNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LmsNotification_userId_dedupeKey_key" ON "LmsNotification"("userId", "dedupeKey");
CREATE INDEX IF NOT EXISTS "LmsNotification_userId_readAt_createdAt_idx" ON "LmsNotification"("userId", "readAt", "createdAt" DESC);

DO $$ BEGIN
  ALTER TABLE "LmsNotification" ADD CONSTRAINT "LmsNotification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- TryoutSession (also created in 20260622140000_tryout_attempt_answers; idempotent here)
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

-- LiveClass (dashboard live preview)
CREATE TABLE IF NOT EXISTS "LiveClass" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "senseiName" TEXT NOT NULL,
    "senseiLevel" TEXT,
    "category" TEXT NOT NULL,
    "level" "LevelJLPT" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "maxSlots" INTEGER NOT NULL DEFAULT 30,
    "filledSlots" INTEGER NOT NULL DEFAULT 0,
    "thumbUrl" TEXT,
    "meetingUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiveClass_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LiveClass_scheduledAt_idx" ON "LiveClass"("scheduledAt");
CREATE INDEX IF NOT EXISTS "LiveClass_isPublished_scheduledAt_idx" ON "LiveClass"("isPublished", "scheduledAt");

-- Lesson comments
CREATE TABLE IF NOT EXISTS "LessonComment" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LessonComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LessonComment_lessonId_createdAt_idx" ON "LessonComment"("lessonId", "createdAt" DESC);

DO $$ BEGIN
  ALTER TABLE "LessonComment" ADD CONSTRAINT "LessonComment_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LessonComment" ADD CONSTRAINT "LessonComment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "LessonCommentReply" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "isInstructor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonCommentReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LessonCommentReply_commentId_createdAt_idx" ON "LessonCommentReply"("commentId", "createdAt" ASC);

DO $$ BEGIN
  ALTER TABLE "LessonCommentReply" ADD CONSTRAINT "LessonCommentReply_commentId_fkey"
    FOREIGN KEY ("commentId") REFERENCES "LessonComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LessonCommentReply" ADD CONSTRAINT "LessonCommentReply_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Foreign keys (idempotent)
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_equippedBadgeId_fkey"
    FOREIGN KEY ("equippedBadgeId") REFERENCES "LmsBadge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Question" ADD CONSTRAINT "Question_tryoutSessionId_fkey"
    FOREIGN KEY ("tryoutSessionId") REFERENCES "TryoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Question_tryoutSessionId_tryoutLevel_sortOrder_idx"
  ON "Question"("tryoutSessionId", "tryoutLevel", "sortOrder");
