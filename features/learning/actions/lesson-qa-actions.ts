'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { getCoreSession } from '@/lib/core/get-core-session';
import { userHasLmsAdminAccess } from '@/lib/auth/resolve-lms-admin';
import {
  buildReplyTree,
  buildReplyWithMention,
  stripReplyMention,
} from '@/features/learning/lib/lesson-qa-utils';
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
  canDelete: boolean;
  replies: LessonCommentReplyView[];
};

export type LessonCommentView = {
  id: string;
  author: string;
  avatarInitial: string;
  content: string;
  time: string;
  likes: number;
  isInstructor: boolean;
  isYou: boolean;
  canDelete: boolean;
  replies: LessonCommentReplyView[];
};

type LessonCommentReplyRow = {
  id: string;
  userId: string;
  parentReplyId: string | null;
  content: string;
  likes: number;
  isInstructor: boolean;
  createdAt: Date;
  user: { displayName: string | null; ssoDisplayName: string | null };
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
  const session = viewer ? await getCoreSession().catch(() => null) : null;
  const canModerate = viewer
    ? await userHasLmsAdminAccess(viewer, session?.roles ?? [])
    : false;

  async function toReplyView(
    reply: ReturnType<typeof buildReplyTree<LessonCommentReplyRow>>[number],
  ): Promise<LessonCommentReplyView> {
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
      canDelete: canModerate || viewer === reply.userId,
      replies: await Promise.all(reply.replies.map(toReplyView)),
    };
  }

  return Promise.all(
    rows.map(async (row) => {
      const author = await resolveDisplayName(row.user.displayName, row.user.ssoDisplayName);
      const replyTree = buildReplyTree(
        row.replies.map((reply) => ({
          id: reply.id,
          userId: reply.userId,
          parentReplyId: reply.parentReplyId,
          content: reply.content,
          likes: reply.likes,
          isInstructor: reply.isInstructor,
          createdAt: reply.createdAt,
          user: {
            displayName: reply.user.displayName,
            ssoDisplayName: reply.user.ssoDisplayName,
          },
        })),
      );

      return {
        id: row.id,
        author,
        avatarInitial: getInitial(author),
        content: row.content,
        time: formatRelativeTime(row.createdAt),
        likes: row.likes,
        isInstructor:
          row.isInstructor ||
          (await userHasLmsAdminAccess(row.userId, [])) ||
          (viewer === row.userId && canModerate),
        isYou: viewer === row.userId,
        canDelete: canModerate || viewer === row.userId,
        replies: await Promise.all(replyTree.map(toReplyView)),
      };
    }),
  );
}

export async function postLessonComment(lessonId: string, content: string) {
  const userId = await requireAuthUserWithAnchor();
  const session = await getCoreSession();
  const isInstructor = await userHasLmsAdminAccess(userId, session?.roles ?? []);
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
    data: { lessonId, userId, content: trimmed, isInstructor },
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
  options?: { replyToAuthor?: string; parentReplyId?: string | null },
) {
  const userId = await requireAuthUserWithAnchor();
  const session = await getCoreSession();
  const isInstructor = await userHasLmsAdminAccess(userId, session?.roles ?? []);

  const replyToAuthor = options?.replyToAuthor;
  const bodyText = replyToAuthor ? stripReplyMention(replyToAuthor, content) : content.trim();

  if (bodyText.length < 3) {
    return { ok: false as const, message: 'Balasan minimal 3 karakter.' };
  }
  if (bodyText.length > 2000) {
    return { ok: false as const, message: 'Balasan terlalu panjang (maks. 2000 karakter).' };
  }

  const comment = await prisma.lessonComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!comment) return { ok: false as const, message: 'Komentar tidak ditemukan.' };

  const parentReplyId = options?.parentReplyId ?? null;
  if (parentReplyId) {
    const parentReply = await prisma.lessonCommentReply.findUnique({
      where: { id: parentReplyId },
      select: { commentId: true },
    });
    if (!parentReply || parentReply.commentId !== commentId) {
      return { ok: false as const, message: 'Balasan induk tidak ditemukan.' };
    }
  }

  const trimmed = replyToAuthor
    ? buildReplyWithMention(replyToAuthor, bodyText)
    : bodyText;

  await prisma.lessonCommentReply.create({
    data: { commentId, parentReplyId, userId, content: trimmed, isInstructor },
  });

  revalidatePath('/dashboard/belajar');
  return { ok: true as const };
}

async function canDeleteComment(ownerId: string, viewerId: string): Promise<boolean> {
  if (ownerId === viewerId) return true;

  const session = await getCoreSession();
  return userHasLmsAdminAccess(viewerId, session?.roles ?? []);
}

export async function deleteLessonComment(commentId: string) {
  const userId = await requireAuthUserWithAnchor();
  const comment = await prisma.lessonComment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  if (!comment) return { ok: false as const, message: 'Komentar tidak ditemukan.' };

  if (!(await canDeleteComment(comment.userId, userId))) {
    return { ok: false as const, message: 'Kamu tidak memiliki izin menghapus komentar ini.' };
  }

  await prisma.lessonComment.delete({ where: { id: commentId } });

  revalidatePath('/dashboard/belajar');
  return { ok: true as const };
}

export async function deleteLessonCommentReply(replyId: string) {
  const userId = await requireAuthUserWithAnchor();
  const reply = await prisma.lessonCommentReply.findUnique({
    where: { id: replyId },
    select: { userId: true },
  });
  if (!reply) return { ok: false as const, message: 'Balasan tidak ditemukan.' };

  if (!(await canDeleteComment(reply.userId, userId))) {
    return { ok: false as const, message: 'Kamu tidak memiliki izin menghapus balasan ini.' };
  }

  await prisma.lessonCommentReply.delete({ where: { id: replyId } });

  revalidatePath('/dashboard/belajar');
  return { ok: true as const };
}
