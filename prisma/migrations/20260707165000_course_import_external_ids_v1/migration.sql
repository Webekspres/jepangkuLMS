ALTER TABLE "Course"
ADD COLUMN "courseExternalId" TEXT;

CREATE UNIQUE INDEX "Course_courseExternalId_key"
ON "Course"("courseExternalId");

ALTER TABLE "Module"
ADD COLUMN "moduleExternalId" TEXT;

CREATE UNIQUE INDEX "Module_courseId_moduleExternalId_key"
ON "Module"("courseId", "moduleExternalId");

ALTER TABLE "Lesson"
ADD COLUMN "lessonExternalId" TEXT;

CREATE UNIQUE INDEX "Lesson_moduleId_lessonExternalId_key"
ON "Lesson"("moduleId", "lessonExternalId");
