'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { PLACEMENT_PAPER } from '@/features/placement/data/placement-paper';
import { scorePlacementAnswers } from '@/features/placement/lib/score-placement';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export type SubmitPlacementResult =
  | { ok: true; attemptId: string }
  | { ok: false; error: string };

export async function submitPlacementAttempt(
  answers: Record<string, string>,
): Promise<SubmitPlacementResult> {
  const userId = await requireAuthUserWithAnchor();
  const questionIds = new Set(PLACEMENT_PAPER.questions.map((q) => q.id));
  const optionIdsByQuestion = new Map(
    PLACEMENT_PAPER.questions.map((q) => [q.id, new Set(q.options.map((o) => o.id))]),
  );

  const sanitized: Record<string, string> = {};
  for (const [qid, oid] of Object.entries(answers)) {
    if (!questionIds.has(qid)) continue;
    const allowed = optionIdsByQuestion.get(qid);
    if (!allowed?.has(oid)) continue;
    sanitized[qid] = oid;
  }

  if (Object.keys(sanitized).length === 0) {
    return { ok: false, error: 'Belum ada jawaban yang valid.' };
  }

  const scored = scorePlacementAnswers(sanitized);

  const attempt = await prisma.placementAttempt.create({
    data: {
      userId,
      paperId: PLACEMENT_PAPER.id,
      paperVersion: PLACEMENT_PAPER.version,
      score: scored.score,
      correctCount: scored.correctCount,
      totalQuestions: scored.totalQuestions,
      recommendedLevel: scored.recommendedLevel,
      answersJson: JSON.stringify(sanitized),
    },
    select: { id: true },
  });

  revalidatePath(STUDENT_ROUTES.placement);
  revalidatePath(STUDENT_ROUTES.placementResult(attempt.id));

  return { ok: true, attemptId: attempt.id };
}

/** Tutup dialog ajakan tes penempatan — tidak muncul lagi. */
export async function dismissPlacementPromptAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const userId = await requireAuthUserWithAnchor();
    await prisma.user.update({
      where: { id: userId },
      data: { placementPromptDismissedAt: new Date() },
    });
    revalidatePath('/dashboard');
    revalidatePath(STUDENT_ROUTES.placement);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan pilihan.';
    return { ok: false, error: message };
  }
}
