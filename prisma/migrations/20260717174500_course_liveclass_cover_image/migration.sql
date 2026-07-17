-- AlterTable
ALTER TABLE "Course" ADD COLUMN "coverImageUrl" TEXT;

-- RenameColumn
ALTER TABLE "LiveClass" RENAME COLUMN "thumbUrl" TO "coverImageUrl";
