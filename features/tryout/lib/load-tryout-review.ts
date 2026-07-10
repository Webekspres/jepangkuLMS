import { cache } from 'react';
import type { LevelJLPT } from '@prisma/client';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import {
  getTryoutSectionMeta,
  type TryoutSectionValue,
} from '@/features/admin-cms/lib/tryout-sections';
import {
  loadTryoutExamPaper,
  type PaperSnapshotPayload,
} from '@/features/tryout/lib/load-tryout-exam-paper';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { prisma } from '@/lib/prisma';

export type TryoutReviewQuestion = {
  id: string;
  examNumber: number;
  section: string;
  sectionLabel: string;
  questionText: string;
  explanation: string | null;
  options: { id: string; text: string; isCorrect: boolean }[];
  selectedOptionId: string | null;
  isCorrect: boolean;
  correctOptionText: string | null;
  selectedOptionText: string | null;
};

export type TryoutAttemptReview = {
  attemptId: string;
  sessionTitle: string;
  sessionCode: string;
  phaseLabel: string;
  level: LevelJLPT;
  score: number;
  correct: number;
  total: number;
  pass: boolean;
  submittedAt: string;
  displayName: string;
  sectionBreakdown: {
    section: TryoutSectionValue;
    sectionLabel: string;
    correct: number;
    total: number;
  }[];
  questions: TryoutReviewQuestion[];
};

export const loadTryoutAttemptReview = cache(async function loadTryoutAttemptReview(
  attemptId: string,
): Promise<TryoutAttemptReview | null> {
  const userId = await requireAuthUserId();

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
      type: 'TRYOUT',
      tryoutSessionId: { not: null },
    },
    include: {
      tryoutSession: true,
    },
  });

  if (!attempt?.tryoutSession) return null;

  const attemptLevel = attempt.tryoutLevel ?? attempt.tryoutSession.level;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, ssoDisplayName: true },
  });

  let answers: Record<string, string> = {};
  if (attempt.answersJson) {
    try {
      answers = JSON.parse(attempt.answersJson) as Record<string, string>;
    } catch {
      answers = {};
    }
  }

  let snapshot: PaperSnapshotPayload | null = null;
  if (attempt.paperSnapshotJson) {
    try {
      snapshot = JSON.parse(attempt.paperSnapshotJson) as PaperSnapshotPayload;
    } catch {
      snapshot = null;
    }
  }

  const paper =
    snapshot?.questions?.length
      ? snapshot.questions.map((q, index) => ({
          id: q.id,
          examNumber: index + 1,
          section: q.section,
          sectionLabel: getTryoutSectionMeta(q.section).labelRomaji,
          questionText: q.questionText,
          explanation: q.explanation,
          options: q.options,
        }))
      : (await loadTryoutExamPaper(attempt.tryoutSessionId!)).map((q) => ({
          id: q.id,
          examNumber: q.examNumber,
          section: String(q.section),
          sectionLabel: getTryoutSectionMeta(String(q.section)).labelRomaji,
          questionText: q.questionText,
          explanation: q.explanation,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: Boolean(o.isCorrect),
          })),
        }));

  const questions: TryoutReviewQuestion[] = paper.map((q) => {
    const section = q.section as TryoutSectionValue;
    const selectedOptionId = answers[q.id] ?? null;
    const selected = q.options.find((o) => o.id === selectedOptionId);
    const correctOpt = q.options.find((o) => o.isCorrect);

    return {
      id: q.id,
      examNumber: q.examNumber,
      section,
      sectionLabel: q.sectionLabel,
      questionText: q.questionText,
      explanation: q.explanation,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
      selectedOptionId,
      isCorrect: Boolean(selected?.isCorrect),
      correctOptionText: correctOpt?.text ?? null,
      selectedOptionText: selected?.text ?? null,
    };
  });

  const sectionBreakdown = (['MOJI_GOI', 'BUNPOU_DOKKAI', 'CHOKAI'] as const)
    .map((section) => {
      const sectionQs = questions.filter((q) => q.section === section);
      if (sectionQs.length === 0) return null;
      return {
        section,
        sectionLabel: getTryoutSectionMeta(section).labelRomaji,
        correct: sectionQs.filter((q) => q.isCorrect).length,
        total: sectionQs.length,
      };
    })
    .filter(Boolean) as TryoutAttemptReview['sectionBreakdown'];

  return {
    attemptId: attempt.id,
    sessionTitle: attempt.tryoutSession.title,
    sessionCode: attempt.tryoutSession.code,
    phaseLabel: attempt.tryoutSession.phaseLabel,
    level: attemptLevel,
    score: attempt.score,
    correct: attempt.correctCount ?? questions.filter((q) => q.isCorrect).length,
    total: attempt.totalQuestions ?? questions.length,
    pass: attempt.score >= 60,
    submittedAt: attempt.createdAt.toISOString(),
    displayName: resolvePublicDisplayName({
      displayName: user?.displayName,
      ssoDisplayName: user?.ssoDisplayName,
    }),
    sectionBreakdown,
    questions,
  };
});
