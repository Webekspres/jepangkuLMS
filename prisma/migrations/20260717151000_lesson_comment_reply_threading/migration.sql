-- Enable nested lesson Q&A replies while keeping existing flat replies as root-level replies.
ALTER TABLE "LessonCommentReply" ADD COLUMN "parentReplyId" TEXT;

ALTER TABLE "LessonCommentReply"
ADD CONSTRAINT "LessonCommentReply_parentReplyId_fkey"
FOREIGN KEY ("parentReplyId") REFERENCES "LessonCommentReply"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LessonCommentReply_commentId_parentReplyId_createdAt_idx"
ON "LessonCommentReply"("commentId", "parentReplyId", "createdAt" ASC);
