/**
 * Flatten Paket Soal (or legacy composition) into a one-question-per-page exam paper DTO.
 */
import type {
  JlptAnswerOptionKind,
  JlptQuestion,
  JlptQuestionOption,
  ListeningStimulus,
  TryoutSectionCode,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  assignTryoutExamNumbers,
  sortTryoutExamQuestions,
} from '@/features/admin-cms/lib/tryout-sections';

const SECTION_LABELS: Record<string, string> = {
  MOJI_GOI: 'MOJI GOI',
  BUNPOU_DOKKAI: 'BUNPOU DOKKAI',
  CHOKAI: 'CHOKAI',
};

export type TryoutPaperStimulus = {
  id: string;
  code: string;
  instructionText: string | null;
  audioUrl: string | null;
  audioStartMs: number;
  audioEndMs: number | null;
  imageUrl: string | null;
};

export type TryoutPaperQuestion = {
  id: string;
  code: string;
  sortOrder: number;
  examNumber: number;
  section: TryoutSectionCode | string;
  sectionLabel: string;
  questionText: string;
  explanation: string | null;
  answerOptionKind: 'TEXT' | 'IMAGE' | null;
  stemImageUrl: string | null;
  stimulusId: string | null;
  stimulus: TryoutPaperStimulus | null;
  /** @deprecated Prefer stimulus — kept for workspace compat during cutover */
  audioUrl: string | null;
  /** @deprecated Prefer stimulusId */
  audioGroupId: string | null;
  imageUrl: string | null;
  options: { id: string; text: string; imageUrl: string | null; isCorrect?: boolean }[];
};

type QuestionWithOptions = JlptQuestion & {
  options: JlptQuestionOption[];
  listeningStimulus: ListeningStimulus | null;
};

type CompositionItem = {
  section: TryoutSectionCode;
  jlptQuestionId: string | null;
  listeningStimulusId: string | null;
  jlptQuestion: QuestionWithOptions | null;
  listeningStimulus:
    | (ListeningStimulus & {
        questions: QuestionWithOptions[];
      })
    | null;
};

function mapStimulus(s: ListeningStimulus): TryoutPaperStimulus {
  return {
    id: s.id,
    code: s.code,
    instructionText: s.instructionText,
    audioUrl: s.audioUrl,
    audioStartMs: s.audioStartMs,
    audioEndMs: s.audioEndMs,
    imageUrl: s.imageUrl,
  };
}

function mapQuestion(
  q: QuestionWithOptions,
  section: TryoutSectionCode | string,
  sortOrder: number,
  stimulusOverride: ListeningStimulus | null,
): Omit<TryoutPaperQuestion, 'examNumber'> {
  const stimulus = stimulusOverride ?? q.listeningStimulus;
  const kind: JlptAnswerOptionKind | null = q.answerOptionKind;
  return {
    id: q.id,
    code: q.code,
    sortOrder,
    section,
    sectionLabel: SECTION_LABELS[section] ?? section,
    questionText: q.questionText,
    explanation: q.explanation,
    answerOptionKind: kind === 'IMAGE' ? 'IMAGE' : kind === 'TEXT' ? 'TEXT' : null,
    stemImageUrl: q.stemImageUrl,
    stimulusId: stimulus?.id ?? null,
    stimulus: stimulus ? mapStimulus(stimulus) : null,
    audioUrl: stimulus?.audioUrl ?? null,
    audioGroupId: stimulus?.id ?? null,
    imageUrl: stimulus?.imageUrl ?? q.stemImageUrl,
    options: q.options
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
      .map((o) => ({
        id: o.id,
        text: o.text,
        imageUrl: o.imageUrl,
        isCorrect: o.isCorrect,
      })),
  };
}

const compositionInclude = {
  jlptQuestion: {
    include: {
      options: true,
      listeningStimulus: true,
    },
  },
  listeningStimulus: {
    include: {
      questions: {
        where: { status: { not: 'RETIRED' as const } },
        orderBy: { stimulusSortOrder: 'asc' as const },
        include: {
          options: true,
          listeningStimulus: true,
        },
      },
    },
  },
} as const;

function flattenCompositionItems(items: CompositionItem[]): TryoutPaperQuestion[] {
  const flat: Omit<TryoutPaperQuestion, 'examNumber'>[] = [];
  let order = 0;

  for (const item of items) {
    if (item.listeningStimulusId && item.listeningStimulus) {
      const stimulus = item.listeningStimulus;
      for (const q of stimulus.questions) {
        order += 1;
        flat.push(
          mapQuestion({ ...q, listeningStimulus: stimulus }, item.section, order, stimulus),
        );
      }
      continue;
    }

    if (item.jlptQuestionId && item.jlptQuestion) {
      order += 1;
      flat.push(
        mapQuestion(item.jlptQuestion, item.section, order, item.jlptQuestion.listeningStimulus),
      );
    }
  }

  return assignTryoutExamNumbers(sortTryoutExamQuestions(flat)) as TryoutPaperQuestion[];
}

/**
 * Build ordered exam paper from session's Paket Soal.
 * Dual-read fallback: TryoutSessionItem → legacy Question.tryoutSessionId.
 */
export async function loadTryoutExamPaper(sessionId: string): Promise<TryoutPaperQuestion[]> {
  const session = await prisma.tryoutSession.findUnique({
    where: { id: sessionId },
    select: { questionSetId: true },
  });

  if (session?.questionSetId) {
    const setItems = await prisma.jlptQuestionSetItem.findMany({
      where: { questionSetId: session.questionSetId },
      orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }],
      include: compositionInclude,
    });
    if (setItems.length > 0) {
      return flattenCompositionItems(setItems);
    }
  }

  const items = await prisma.tryoutSessionItem.findMany({
    where: { tryoutSessionId: sessionId },
    orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }],
    include: compositionInclude,
  });

  if (items.length > 0) {
    return flattenCompositionItems(items);
  }

  // Legacy dual-read fallback
  const legacy = await prisma.question.findMany({
    where: { type: 'TRYOUT', tryoutSessionId: sessionId },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });

  if (legacy.length === 0) return [];

  const mapped = legacy.map((q) => ({
    id: q.id,
    code: q.id,
    sortOrder: q.sortOrder,
    section: q.tryoutSection ?? 'MOJI_GOI',
    sectionLabel: SECTION_LABELS[q.tryoutSection ?? 'MOJI_GOI'] ?? 'Soal',
    questionText: q.questionText,
    explanation: q.explanation,
    answerOptionKind:
      q.answerOptionKind === 'IMAGE'
        ? ('IMAGE' as const)
        : q.answerOptionKind === 'TEXT'
          ? ('TEXT' as const)
          : null,
    stemImageUrl: q.imageUrl,
    stimulusId: q.audioGroupId,
    stimulus: q.audioUrl
      ? {
          id: q.audioGroupId ?? q.id,
          code: q.audioGroupId ?? q.id,
          instructionText: null,
          audioUrl: q.audioUrl,
          audioStartMs: 0,
          audioEndMs: null,
          imageUrl: q.imageUrl,
        }
      : null,
    audioUrl: q.audioUrl,
    audioGroupId: q.audioGroupId,
    imageUrl: q.imageUrl,
    options: q.options.map((o) => ({
      id: o.id,
      text: o.text,
      imageUrl: o.imageUrl,
    })),
  }));

  return assignTryoutExamNumbers(sortTryoutExamQuestions(mapped)) as TryoutPaperQuestion[];
}

export type PaperSnapshotPayload = {
  version: 1;
  sessionId: string;
  questions: Array<{
    id: string;
    code: string;
    section: string;
    questionText: string;
    explanation: string | null;
    stimulusId: string | null;
    stimulusCode: string | null;
    options: Array<{
      id: string;
      text: string;
      imageUrl: string | null;
      isCorrect: boolean;
    }>;
  }>;
};

export function buildPaperSnapshot(
  sessionId: string,
  paper: TryoutPaperQuestion[],
): PaperSnapshotPayload {
  return {
    version: 1,
    sessionId,
    questions: paper.map((q) => ({
      id: q.id,
      code: q.code,
      section: String(q.section),
      questionText: q.questionText,
      explanation: q.explanation,
      stimulusId: q.stimulusId,
      stimulusCode: q.stimulus?.code ?? null,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
        imageUrl: o.imageUrl,
        isCorrect: Boolean(o.isCorrect),
      })),
    })),
  };
}
