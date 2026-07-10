import { prisma } from '@/lib/prisma';
import type { LevelJLPT, TryoutSectionCode } from '@prisma/client';

export async function loadAdminJlptBank(filters?: {
  level?: LevelJLPT;
  section?: TryoutSectionCode;
  q?: string;
}) {
  const q = filters?.q?.trim();
  const questions = await prisma.jlptQuestion.findMany({
    where: {
      ...(filters?.level ? { level: filters.level } : {}),
      ...(filters?.section ? { section: filters.section } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { questionText: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { options: true, sessionItems: true } },
      listeningStimulus: { select: { id: true, code: true } },
    },
    orderBy: [{ level: 'asc' }, { section: 'asc' }, { code: 'asc' }],
    take: 500,
  });

  const stimuli = await prisma.listeningStimulus.findMany({
    where: {
      ...(filters?.level ? { level: filters.level } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { instructionText: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { questions: true, sessionItems: true } },
    },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
    take: 200,
  });

  return { questions, stimuli };
}

export async function loadAdminSessionCompose(sessionId: string) {
  const session = await prisma.tryoutSession.findUnique({ where: { id: sessionId } });
  if (!session) return null;

  const items = await prisma.tryoutSessionItem.findMany({
    where: { tryoutSessionId: sessionId },
    orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }],
    include: {
      jlptQuestion: { select: { id: true, code: true, questionText: true, section: true } },
      listeningStimulus: {
        select: {
          id: true,
          code: true,
          instructionText: true,
          _count: { select: { questions: true } },
        },
      },
    },
  });

  const availableQuestions = await prisma.jlptQuestion.findMany({
    where: {
      level: session.level,
      section: { in: ['MOJI_GOI', 'BUNPOU_DOKKAI'] },
      status: 'ACTIVE',
      sessionItems: { none: { tryoutSessionId: sessionId } },
    },
    orderBy: { code: 'asc' },
    take: 300,
  });

  const availableStimuli = await prisma.listeningStimulus.findMany({
    where: {
      level: session.level,
      status: 'ACTIVE',
      sessionItems: { none: { tryoutSessionId: sessionId } },
      questions: { some: {} },
    },
    include: { _count: { select: { questions: true } } },
    orderBy: { code: 'asc' },
    take: 100,
  });

  return { session, items, availableQuestions, availableStimuli };
}
