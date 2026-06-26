import { prisma } from '@/lib/prisma';
import { isLmsAdmin } from '@/lib/auth/resolve-lms-admin';
import { extractYouTubeVideoId } from '@/features/learning/lib/lesson-video';

export type LessonVideoAccessResult =
  | { ok: true; videoId: string; lessonTitle: string }
  | { ok: false; reason: 'not_found' | 'not_enrolled' | 'no_video' };

/** Resolve YouTube video id only when the user has ACTIVE enrollment for the lesson's course. */
export async function resolveLessonVideoAccess(
  userId: string,
  lessonId: string,
): Promise<LessonVideoAccessResult> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      title: true,
      videoUrl: true,
      module: { select: { courseId: true } },
    },
  });

  if (!lesson) {
    return { ok: false, reason: 'not_found' };
  }

  // Admin bypass — akses video tanpa enrollment
  const adminAccess = await isLmsAdmin(userId);

  if (!adminAccess) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId: lesson.module.courseId },
      },
      select: { status: true },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      return { ok: false, reason: 'not_enrolled' };
    }
  }

  const videoId = extractYouTubeVideoId(lesson.videoUrl ?? '');
  if (!videoId) {
    return { ok: false, reason: 'no_video' };
  }

  return { ok: true, videoId, lessonTitle: lesson.title };
}
