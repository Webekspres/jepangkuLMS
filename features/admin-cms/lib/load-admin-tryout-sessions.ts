import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export type AdminTryoutSessionRow = {
  id: string;
  code: string;
  title: string;
  phaseLabel: string;
  scheduledAt: string | null;
  timeLimitMinutes: number;
  isActive: boolean;
  sortOrder: number;
  questionCount: number;
};

export const loadAdminTryoutSessions = cache(async function loadAdminTryoutSessions(): Promise<
  AdminTryoutSessionRow[]
> {
  const rows = await prisma.tryoutSession.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { questions: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    phaseLabel: row.phaseLabel,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    timeLimitMinutes: row.timeLimitMinutes,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    questionCount: row._count.questions,
  }));
});

export async function loadAdminTryoutSessionById(id: string) {
  const row = await prisma.tryoutSession.findUnique({ where: { id } });
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    phaseLabel: row.phaseLabel,
    description: row.description,
    scheduledAt: row.scheduledAt?.toISOString().slice(0, 16) ?? '',
    timeLimitMinutes: row.timeLimitMinutes,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    priceIdr: row.priceIdr,
    isStrictTimeBound: row.isStrictTimeBound,
  };
}
