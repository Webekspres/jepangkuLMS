'use server';

import { revalidatePath } from 'next/cache';
import type { JlptBankStatus } from '@prisma/client';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import {
  releaseJlptQuestionR2Assets,
  releaseListeningStimulusR2Assets,
} from '@/lib/media/jlpt-bank-r2-cleanup';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';

function revalidateBank() {
  revalidatePath(ADMIN_ROUTES.tryoutBank);
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
}

export async function setJlptQuestionStatusAction(
  questionId: string,
  status: JlptBankStatus,
): Promise<CmsActionResult> {
  await requireAdminAction();
  const row = await prisma.jlptQuestion.findUnique({ where: { id: questionId } });
  if (!row) return { ok: false, message: 'Soal bank tidak ditemukan.' };

  if (status === 'RETIRED') {
    await prisma.jlptQuestion.update({
      where: { id: questionId },
      data: { status },
    });
    await releaseJlptQuestionR2Assets(questionId);
  } else {
    await prisma.jlptQuestion.update({
      where: { id: questionId },
      data: { status },
    });
  }

  revalidateBank();
  return { ok: true };
}

export async function setListeningStimulusStatusAction(
  stimulusId: string,
  status: JlptBankStatus,
): Promise<CmsActionResult> {
  await requireAdminAction();
  const row = await prisma.listeningStimulus.findUnique({ where: { id: stimulusId } });
  if (!row) return { ok: false, message: 'Stimulus tidak ditemukan.' };

  if (status === 'RETIRED') {
    const activeQuestions = await prisma.jlptQuestion.count({
      where: { listeningStimulusId: stimulusId, status: 'ACTIVE' },
    });
    if (activeQuestions > 0) {
      return {
        ok: false,
        message: 'Stimulus masih dipakai soal aktif. Arsipkan soal terkait dulu.',
      };
    }

    await prisma.listeningStimulus.update({
      where: { id: stimulusId },
      data: { status },
    });
    await releaseListeningStimulusR2Assets(stimulusId);
  } else {
    await prisma.listeningStimulus.update({
      where: { id: stimulusId },
      data: { status },
    });
  }

  revalidateBank();
  return { ok: true };
}
