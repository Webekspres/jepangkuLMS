'use server';

import { revalidatePath } from 'next/cache';
import type { LevelJLPT } from '@prisma/client';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { type TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';
import { tryoutQuestionSchema, type TryoutQuestionInput } from '@/features/admin-cms/lib/validations';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';

function revalidateTryout(sessionId: string) {
  revalidatePath(ADMIN_ROUTES.tryoutSessionQuestions(sessionId));
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath('/dashboard/tryout');
}

async function assertTryoutSession(sessionId: string) {
  const session = await prisma.tryoutSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Sesi tryout tidak ditemukan.');
  return session;
}

async function nextSortOrder(
  sessionId: string,
  level: LevelJLPT,
  section: TryoutSectionValue,
): Promise<number> {
  const agg = await prisma.question.aggregate({
    where: {
      tryoutSessionId: sessionId,
      tryoutLevel: level,
      tryoutSection: section,
      type: 'TRYOUT',
    },
    _max: { sortOrder: true },
  });
  return (agg._max.sortOrder ?? 0) + 1;
}

function resolveChokaiAudioFields(data: TryoutQuestionInput) {
  if (data.tryoutSection !== 'CHOKAI') {
    return { audioUrl: null, audioGroupId: null };
  }

  const audioUrl = data.audioUrl?.trim() || null;
  const audioGroupId =
    data.audioMode === 'group' ? data.audioGroupId?.trim() || null : null;

  return { audioUrl, audioGroupId };
}

export async function createTryoutQuestionAction(
  input: unknown,
): Promise<CmsActionResult & { id?: string }> {
  await requireAdminAction();
  const parsed = tryoutQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await assertTryoutSession(data.tryoutSessionId);

  const correctCount = data.options.filter((opt) => opt.isCorrect).length;
  if (correctCount !== 1) {
    return { ok: false, message: 'Pilih tepat satu jawaban benar.' };
  }

  const sortOrder = await nextSortOrder(
    data.tryoutSessionId,
    data.tryoutLevel,
    data.tryoutSection,
  );
  const audio = resolveChokaiAudioFields(data);

  const row = await prisma.question.create({
    data: {
      type: 'TRYOUT',
      tryoutSessionId: data.tryoutSessionId,
      tryoutLevel: data.tryoutLevel,
      tryoutSection: data.tryoutSection,
      sortOrder,
      questionText: data.questionText,
      explanation: data.explanation || null,
      audioUrl: audio.audioUrl,
      audioGroupId: audio.audioGroupId,
      xpReward: 0,
      options: {
        create: data.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      },
    },
  });

  revalidateTryout(data.tryoutSessionId);
  return { ok: true, id: row.id };
}

export async function updateTryoutQuestionAction(
  questionId: string,
  input: unknown,
): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = tryoutQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await assertTryoutSession(data.tryoutSessionId);

  const existing = await prisma.question.findFirst({
    where: { id: questionId, tryoutSessionId: data.tryoutSessionId, type: 'TRYOUT' },
  });
  if (!existing) return { ok: false, message: 'Soal tryout tidak ditemukan.' };

  const correctCount = data.options.filter((opt) => opt.isCorrect).length;
  if (correctCount !== 1) {
    return { ok: false, message: 'Pilih tepat satu jawaban benar.' };
  }

  const audio = resolveChokaiAudioFields(data);

  await prisma.$transaction([
    prisma.questionOption.deleteMany({ where: { questionId } }),
    prisma.question.update({
      where: { id: questionId },
      data: {
        tryoutLevel: data.tryoutLevel,
        tryoutSection: data.tryoutSection,
        questionText: data.questionText,
        explanation: data.explanation || null,
        audioUrl: audio.audioUrl,
        audioGroupId: audio.audioGroupId,
        options: {
          create: data.options.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        },
      },
    }),
  ]);

  revalidateTryout(data.tryoutSessionId);
  return { ok: true };
}

export async function deleteTryoutQuestionAction(
  sessionId: string,
  questionId: string,
): Promise<CmsActionResult> {
  await requireAdminAction();
  await assertTryoutSession(sessionId);

  const existing = await prisma.question.findFirst({
    where: { id: questionId, tryoutSessionId: sessionId, type: 'TRYOUT' },
  });
  if (!existing) return { ok: false, message: 'Soal tryout tidak ditemukan.' };

  await prisma.question.delete({ where: { id: questionId } });
  revalidateTryout(sessionId);
  return { ok: true };
}
