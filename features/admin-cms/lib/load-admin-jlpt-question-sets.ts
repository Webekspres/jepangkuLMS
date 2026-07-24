import type { JlptQuestionSetStatus, LevelJLPT, TryoutSectionCode } from '@prisma/client';
import { cache } from 'react';
import {
  buildJlptCompleteness,
  countFlattenedBySection,
  type JlptCompleteness,
  type JlptQuestionSetDerivedStats,
} from '@/features/admin-cms/lib/jlpt-question-set-stats';
import { prisma } from '@/lib/prisma';

export type AdminJlptQuestionSetRow = {
  id: string;
  code: string;
  title: string;
  level: LevelJLPT;
  status: JlptQuestionSetStatus;
  source: string | null;
  year: number | null;
  description: string | null;
  updatedAt: string;
  stats: JlptQuestionSetDerivedStats;
};

export type AdminJlptQuestionSetItemEditData = {
  kind: 'question' | 'stimulus';
  questionId: string;
  code: string;
  questionText: string;
  explanation: string;
  options: { text: string; isCorrect: boolean }[];
  /** Choukai stimulus fields (null for Moji/Bunpou). */
  instructionText: string;
  audioUrl: string;
  imageUrl: string | null;
  imageObjectKey: string | null;
  mondaiOrder: number;
  questionCountInGroup: number;
};

export type AdminJlptQuestionSetItemRow = {
  id: string;
  section: TryoutSectionCode;
  sortOrder: number;
  jlptQuestionId: string | null;
  listeningStimulusId: string | null;
  label: string;
  questionCount: number;
  editData: AdminJlptQuestionSetItemEditData | null;
};

export type AdminJlptQuestionSetDetail = AdminJlptQuestionSetRow & {
  chokaiAudioUrl: string | null;
  chokaiAudioOriginalName: string | null;
  items: AdminJlptQuestionSetItemRow[];
  availableQuestions: Array<{
    id: string;
    code: string;
    section: TryoutSectionCode;
    questionText: string;
  }>;
  availableStimuli: Array<{
    id: string;
    code: string;
    questionCount: number;
  }>;
};

function deriveStats(
  items: Array<{
    section: TryoutSectionCode;
    jlptQuestionId: string | null;
    listeningStimulus: { _count: { questions: number } } | null;
  }>,
  activeSessionCount: number,
  level: LevelJLPT,
): JlptQuestionSetDerivedStats {
  const counts = countFlattenedBySection(items);
  return {
    ...counts,
    activeSessionCount,
    isContentLocked: activeSessionCount > 0,
    jlptCompleteness: buildJlptCompleteness(counts, level),
  };
}

export const loadAdminJlptQuestionSets = cache(async function loadAdminJlptQuestionSets(): Promise<
  AdminJlptQuestionSetRow[]
> {
  const rows = await prisma.jlptQuestionSet.findMany({
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
    include: {
      items: {
        select: {
          section: true,
          jlptQuestionId: true,
          listeningStimulus: { select: { _count: { select: { questions: true } } } },
        },
      },
      _count: { select: { sessions: { where: { isActive: true } } } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    level: row.level,
    status: row.status,
    source: row.source,
    year: row.year,
    description: row.description,
    updatedAt: row.updatedAt.toISOString(),
    stats: deriveStats(row.items, row._count.sessions, row.level),
  }));
});

export async function loadAdminJlptQuestionSetById(
  id: string,
): Promise<AdminJlptQuestionSetDetail | null> {
  const row = await prisma.jlptQuestionSet.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }],
        include: {
          jlptQuestion: {
            select: {
              id: true,
              code: true,
              questionText: true,
              explanation: true,
              mondaiOrder: true,
              stemImageUrl: true,
              stemImageObjectKey: true,
              options: {
                orderBy: { sortOrder: 'asc' },
                select: { text: true, isCorrect: true },
              },
            },
          },
          listeningStimulus: {
            select: {
              id: true,
              code: true,
              instructionText: true,
              audioUrl: true,
              imageUrl: true,
              imageObjectKey: true,
              _count: { select: { questions: true } },
              questions: {
                where: { status: { not: 'RETIRED' } },
                orderBy: { stimulusSortOrder: 'asc' },
                take: 1,
                select: {
                  id: true,
                  code: true,
                  questionText: true,
                  explanation: true,
                  mondaiOrder: true,
                  stemImageUrl: true,
                  stemImageObjectKey: true,
                  options: {
                    orderBy: { sortOrder: 'asc' },
                    select: { text: true, isCorrect: true },
                  },
                },
              },
            },
          },
        },
      },
      _count: { select: { sessions: { where: { isActive: true } } } },
    },
  });
  if (!row) return null;

  const usedQuestionIds = new Set(
    row.items.map((i) => i.jlptQuestionId).filter((x): x is string => Boolean(x)),
  );
  const usedStimulusIds = new Set(
    row.items.map((i) => i.listeningStimulusId).filter((x): x is string => Boolean(x)),
  );

  const [availableQuestions, availableStimuli] = await Promise.all([
    prisma.jlptQuestion.findMany({
      where: {
        level: row.level,
        status: { not: 'RETIRED' },
        section: { in: ['MOJI_GOI', 'BUNPOU_DOKKAI'] },
        id: { notIn: [...usedQuestionIds] },
      },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, section: true, questionText: true },
      take: 200,
    }),
    prisma.listeningStimulus.findMany({
      where: {
        level: row.level,
        status: { not: 'RETIRED' },
        id: { notIn: [...usedStimulusIds] },
      },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        _count: { select: { questions: { where: { status: { not: 'RETIRED' } } } } },
      },
      take: 100,
    }),
  ]);

  const stats = deriveStats(
    row.items.map((i) => ({
      section: i.section,
      jlptQuestionId: i.jlptQuestionId,
      listeningStimulus: i.listeningStimulus
        ? { _count: { questions: i.listeningStimulus._count.questions } }
        : null,
    })),
    row._count.sessions,
    row.level,
  );

  return {
    id: row.id,
    code: row.code,
    title: row.title,
    level: row.level,
    status: row.status,
    source: row.source,
    year: row.year,
    description: row.description,
    chokaiAudioUrl: row.chokaiAudioUrl,
    chokaiAudioOriginalName: row.chokaiAudioOriginalName,
    updatedAt: row.updatedAt.toISOString(),
    stats,
    items: row.items.map((i) => {
      const qCount = i.listeningStimulus
        ? i.listeningStimulus._count.questions
        : i.jlptQuestionId
          ? 1
          : 0;

      let editData: AdminJlptQuestionSetItemEditData | null = null;
      if (i.jlptQuestion) {
        editData = {
          kind: 'question',
          questionId: i.jlptQuestion.id,
          code: i.jlptQuestion.code,
          questionText: i.jlptQuestion.questionText,
          explanation: i.jlptQuestion.explanation ?? '',
          options: i.jlptQuestion.options.map((o) => ({
            text: o.text,
            isCorrect: o.isCorrect,
          })),
          instructionText: '',
          audioUrl: '',
          imageUrl: i.jlptQuestion.stemImageUrl,
          imageObjectKey: i.jlptQuestion.stemImageObjectKey,
          mondaiOrder: i.jlptQuestion.mondaiOrder,
          questionCountInGroup: 1,
        };
      } else if (i.listeningStimulus) {
        const firstQ = i.listeningStimulus.questions[0];
        if (firstQ) {
          editData = {
            kind: 'stimulus',
            questionId: firstQ.id,
            code: firstQ.code,
            questionText: firstQ.questionText,
            explanation: firstQ.explanation ?? '',
            options: firstQ.options.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect,
            })),
            instructionText: i.listeningStimulus.instructionText ?? '',
            audioUrl: i.listeningStimulus.audioUrl ?? '',
            imageUrl: firstQ.stemImageUrl ?? i.listeningStimulus.imageUrl,
            imageObjectKey: firstQ.stemImageObjectKey ?? i.listeningStimulus.imageObjectKey,
            mondaiOrder: firstQ.mondaiOrder,
            questionCountInGroup: i.listeningStimulus._count.questions,
          };
        }
      }

      return {
        id: i.id,
        section: i.section,
        sortOrder: i.sortOrder,
        jlptQuestionId: i.jlptQuestionId,
        listeningStimulusId: i.listeningStimulusId,
        label:
          i.section === 'CHOKAI' && i.jlptQuestion
            ? `MONDAI ${i.jlptQuestion.mondaiOrder} · ${i.jlptQuestion.code} — ${i.jlptQuestion.questionText.slice(0, 60)}`
            : i.section === 'CHOKAI' && i.listeningStimulus && i.listeningStimulus.questions[0]
              ? `MONDAI ${i.listeningStimulus.questions[0].mondaiOrder} · ${i.listeningStimulus.code} (${i.listeningStimulus._count.questions} soal)`
              : i.jlptQuestion
                ? `${i.jlptQuestion.code} — ${i.jlptQuestion.questionText.slice(0, 60)}`
                : i.listeningStimulus
                  ? `${i.listeningStimulus.code} (${i.listeningStimulus._count.questions} soal)`
                  : '—',
        questionCount: qCount,
        editData,
      };
    }),
    availableQuestions,
    availableStimuli: availableStimuli
      .filter((s) => s._count.questions > 0)
      .map((s) => ({
        id: s.id,
        code: s.code,
        questionCount: s._count.questions,
      })),
  };
}

/** READY packages for session picker, optionally filtered by level. */
export async function loadReadyQuestionSetsForPicker(level?: LevelJLPT): Promise<
  Array<{
    id: string;
    code: string;
    title: string;
    level: LevelJLPT;
    completeness: JlptCompleteness;
    totalQuestions: number;
  }>
> {
  const rows = await prisma.jlptQuestionSet.findMany({
    where: {
      status: 'READY',
      ...(level ? { level } : {}),
    },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
    include: {
      items: {
        select: {
          section: true,
          jlptQuestionId: true,
          listeningStimulus: { select: { _count: { select: { questions: true } } } },
        },
      },
    },
  });

  return rows.map((row) => {
    const counts = countFlattenedBySection(row.items);
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      level: row.level,
      completeness: buildJlptCompleteness(counts, row.level),
      totalQuestions: counts.totalQuestions,
    };
  });
}
