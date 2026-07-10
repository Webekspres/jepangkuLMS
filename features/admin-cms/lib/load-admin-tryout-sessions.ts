import type { LevelJLPT } from '@prisma/client';
import { cache } from 'react';
import { getEnrollmentCountsByProduct } from '@/features/admin-cms/lib/enrollment-counts';
import { prisma } from '@/lib/prisma';

export type AdminTryoutSessionRow = {
  id: string;
  code: string;
  title: string;
  phaseLabel: string;
  level: LevelJLPT;
  scheduledAt: string | null;
  timeLimitMinutes: number;
  isActive: boolean;
  sortOrder: number;
  questionCount: number;
  questionSetId: string | null;
  questionSetCode: string | null;
  questionSetTitle: string | null;
  activeEnrollments: number;
  pendingEnrollments: number;
};

function countPaperQuestions(
  items: Array<{
    jlptQuestionId: string | null;
    listeningStimulus: { _count: { questions: number } } | null;
  }>,
): number {
  let n = 0;
  for (const item of items) {
    if (item.listeningStimulus) {
      n += item.listeningStimulus._count.questions;
    } else if (item.jlptQuestionId) {
      n += 1;
    }
  }
  return n;
}

export const loadAdminTryoutSessions = cache(async function loadAdminTryoutSessions(): Promise<
  AdminTryoutSessionRow[]
> {
  const rows = await prisma.tryoutSession.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      questionSet: {
        select: {
          id: true,
          code: true,
          title: true,
          items: {
            select: {
              jlptQuestionId: true,
              section: true,
              listeningStimulus: { select: { _count: { select: { questions: true } } } },
            },
          },
        },
      },
      items: {
        select: {
          jlptQuestionId: true,
          listeningStimulus: { select: { _count: { select: { questions: true } } } },
        },
      },
      _count: { select: { questions: true } },
    },
  });

  const enrollmentCounts = await getEnrollmentCountsByProduct(
    'TRYOUT',
    rows.map((row) => row.id),
  );

  return rows.map((row) => {
    const fromSet = row.questionSet ? countPaperQuestions(row.questionSet.items) : 0;
    const composed = fromSet > 0 ? fromSet : countPaperQuestions(row.items);
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      phaseLabel: row.phaseLabel,
      level: row.level,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      timeLimitMinutes: row.timeLimitMinutes,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      questionCount: composed > 0 ? composed : row._count.questions,
      questionSetId: row.questionSet?.id ?? null,
      questionSetCode: row.questionSet?.code ?? null,
      questionSetTitle: row.questionSet?.title ?? null,
      activeEnrollments: enrollmentCounts[row.id]?.active ?? 0,
      pendingEnrollments: enrollmentCounts[row.id]?.pending ?? 0,
    };
  });
});

export async function loadAdminTryoutSessionById(id: string) {
  const row = await prisma.tryoutSession.findUnique({ where: { id } });
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    phaseLabel: row.phaseLabel,
    level: row.level,
    description: row.description,
    scheduledAt: row.scheduledAt?.toISOString().slice(0, 16) ?? '',
    timeLimitMinutes: row.timeLimitMinutes,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    priceIdr: row.priceIdr,
    isStrictTimeBound: row.isStrictTimeBound,
    questionSetId: row.questionSetId,
  };
}
