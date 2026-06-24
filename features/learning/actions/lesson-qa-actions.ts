'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { getCoreSession } from '@/lib/core/get-core-session';
import { userHasLmsAdminAccess } from '@/lib/auth/resolve-lms-admin';
import { buildReplyWithMention } from '@/features/learning/lib/lesson-qa-utils';
import { LMS_POINTS, lmsLessonCommentSourceKey } from '@/lib/lms/point-rules';
import { awardLmsPoints } from '@/lib/lms/points';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { prisma } from '@/lib/prisma';

export type LessonCommentReplyView = {
  id: string;
  author: string;
  avatarInitial: string;
  content: string;
  time: string;
  likes: number;
  isInstructor: boolean;
  isYou: boolean;
};

export type LessonCommentView = {
  id: string;
  author: string;
  avatarInitial: string;
  content: string;
  time: string;
  likes: number;
  isYou: boolean;
  replies: LessonCommentReplyView[];
};

function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function resolveDisplayName(
  displayName: string | null,
  ssoDisplayName: string | null,
): Promise<string> {
  return resolvePublicDisplayName({ displayName, ssoDisplayName });
}

export async function loadLessonComments(
  lessonId: string,
  viewerId?: string | null,
): Promise<LessonCommentView[]> {
  const rows = await prisma.lessonComment.findMany({
    where: { lessonId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, displayName: true, ssoDisplayName: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, displayName: true, ssoDisplayName: true } } },
      },
    },
  });

  const viewer = viewerId ?? (await requireAuthUserWithAnchor().catch(() => null));

  return Promise.all(
    rows.map(async (row) => {
      const author = await resolveDisplayName(row.user.displayName, row.user.ssoDisplayName);
      return {
        id: row.id,
        author,
        avatarInitial: getInitial(author),
        content: row.content,
        time: formatRelativeTime(row.createdAt),
        likes: row.likes,
        isYou: viewer === row.userId,
        replies: await Promise.all(
          row.replies.map(async (reply) => {
            const replyAuthor = await resolveDisplayName(
              reply.user.displayName,
              reply.user.ssoDisplayName,
            );
            return {
              id: reply.id,
              author: replyAuthor,
              avatarInitial: getInitial(replyAuthor),
              content: reply.content,
              time: formatRelativeTime(reply.createdAt),
              likes: reply.likes,
              isInstructor: reply.isInstructor,
              isYou: viewer === reply.userId,
            };
          }),
        ),
      };
    }),
  );
}

export async function postLessonComment(lessonId: string, content: string) {
  const userId = await requireAuthUserWithAnchor();
  const trimmed = content.trim();
  if (trimmed.length < 3) {
    return { ok: false as const, message: 'Komentar minimal 3 karakter.' };
  }
  if (trimmed.length > 2000) {
    return { ok: false as const, message: 'Komentar terlalu panjang (maks. 2000 karakter).' };
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
  if (!lesson) return { ok: false as const, message: 'Pelajaran tidak ditemukan.' };

  await prisma.lessonComment.create({
    data: { lessonId, userId, content: trimmed },
  });

  await awardLmsPoints({
    userId,
    pointsGained: LMS_POINTS.LESSON_COMMENT,
    sourceKey: lmsLessonCommentSourceKey(lessonId, userId),
    sourceType: 'LESSON_COMMENT',
    sourceId: lessonId,
  });

  revalidatePath('/dashboard/belajar');
  revalidatePath('/dashboard/leaderboard');
  return { ok: true as const };
}

export async function likeLessonComment(commentId: string) {
  await requireAuthUserWithAnchor();

  await prisma.lessonComment.update({
    where: { id: commentId },
    data: { likes: { increment: 1 } },
  });

  revalidatePath('/dashboard/belajar');
  return { ok: true as const };
}

export async function likeLessonCommentReply(replyId: string) {
  await requireAuthUserWithAnchor();

  await prisma.lessonCommentReply.update({
    where: { id: replyId },
    data: { likes: { increment: 1 } },
  });

  revalidatePath('/dashboard/belajar');
  return { ok: true as const };
}

export async function postLessonCommentReply(
  commentId: string,
  content: string,
  replyToAuthor?: string,
) {
  const userId = await requireAuthUserWithAnchor();
  const session = await getCoreSession();
  const isInstructor = await userHasLmsAdminAccess(userId, session?.roles ?? []);

  let trimmed = content.trim();
  if (replyToAuthor) {
    trimmed = buildReplyWithMention(replyToAuthor, trimmed);
  }

  if (trimmed.length < 3) {
    return { ok: false as const, message: 'Balasan minimal 3 karakter.' };
  }
  if (trimmed.length > 2000) {
    return { ok: false as const, message: 'Balasan terlalu panjang (maks. 2000 karakter).' };
  }

  const comment = await prisma.lessonComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!comment) return { ok: false as const, message: 'Komentar tidak ditemukan.' };

  await prisma.lessonCommentReply.create({
    data: { commentId, userId, content: trimmed, isInstructor },
  });

  revalidatePath('/dashboard/belajar');
  return { ok: true as const };
}
