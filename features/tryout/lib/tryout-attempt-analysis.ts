import type { LevelJLPT } from '@prisma/client';
import {
  getTryoutSectionMeta,
  type TryoutSectionValue,
} from '@/features/admin-cms/lib/tryout-sections';
import {
  buildJlptCefrAnalysis,
  type JlptCefrAnalysis,
} from '@/features/tryout/lib/jlpt-cefr-reference';
import {
  loadTryoutExamPaper,
  type PaperSnapshotPayload,
} from '@/features/tryout/lib/load-tryout-exam-paper';

const TRYOUT_SECTIONS = ['MOJI_GOI', 'BUNPOU_DOKKAI', 'CHOKAI'] as const;

type AttemptInput = {
  id: string;
  answersJson: string | null;
  paperSnapshotJson: string | null;
  tryoutSessionId: string | null;
  tryoutLevel: LevelJLPT | null;
  correctCount: number | null;
  totalQuestions: number | null;
  createdAt: Date;
  tryoutSession: { level: LevelJLPT } | null;
};

export type AnalyzedTryoutAttempt = Pick<
  JlptCefrAnalysis,
  'scaledTotalScore' | 'jlptPassOverall' | 'totalPassScore' | 'totalPassPercent'
> & {
  attemptId: string;
  level: LevelJLPT;
  createdAt: Date;
};

export type AnalyzedTryoutQuestion = {
  id: string;
  examNumber: number;
  section: TryoutSectionValue;
  sectionLabel: string;
  questionText: string;
  explanation: string | null;
  options: { id: string; text: string; isCorrect: boolean }[];
  selectedOptionId: string | null;
  isCorrect: boolean;
  correctOptionText: string | null;
  selectedOptionText: string | null;
};

export type TryoutSectionBreakdown = {
  section: TryoutSectionValue;
  sectionLabel: string;
  correct: number;
  total: number;
};

export function parseAttemptAnswers(answersJson: string | null): Record<string, string> {
  if (!answersJson) return {};

  try {
    return JSON.parse(answersJson) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function buildTryoutAttemptDetails(
  attempt: Pick<AttemptInput, 'answersJson' | 'paperSnapshotJson' | 'tryoutSessionId'>,
): Promise<{
  questions: AnalyzedTryoutQuestion[];
  sectionBreakdown: TryoutSectionBreakdown[];
} | null> {
  if (!attempt.tryoutSessionId) return null;

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
      ? snapshot.questions.map((question, index) => ({
          id: question.id,
          examNumber: index + 1,
          section: question.section,
          sectionLabel: getTryoutSectionMeta(question.section).labelRomaji,
          questionText: question.questionText,
          explanation: question.explanation,
          options: question.options,
        }))
      : (await loadTryoutExamPaper(attempt.tryoutSessionId)).questions.map((question) => ({
          id: question.id,
          examNumber: question.examNumber,
          section: String(question.section),
          sectionLabel: getTryoutSectionMeta(String(question.section)).labelRomaji,
          questionText: question.questionText,
          explanation: question.explanation,
          options: question.options.map((option) => ({
            id: option.id,
            text: option.text,
            isCorrect: Boolean(option.isCorrect),
          })),
        }));

  if (paper.length === 0) return null;

  const answers = parseAttemptAnswers(attempt.answersJson);
  const questions: AnalyzedTryoutQuestion[] = paper.map((question) => {
    const section = question.section as TryoutSectionValue;
    const selectedOptionId = answers[question.id] ?? null;
    const selected = question.options.find((option) => option.id === selectedOptionId);
    const correctOption = question.options.find((option) => option.isCorrect);

    return {
      id: question.id,
      examNumber: question.examNumber,
      section,
      sectionLabel: question.sectionLabel,
      questionText: question.questionText,
      explanation: question.explanation,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
        isCorrect: option.isCorrect,
      })),
      selectedOptionId,
      isCorrect: Boolean(selected?.isCorrect),
      correctOptionText: correctOption?.text ?? null,
      selectedOptionText: selected?.text ?? null,
    };
  });

  const sectionBreakdown = TRYOUT_SECTIONS.flatMap((section) => {
    const sectionQuestions = questions.filter((question) => question.section === section);
    if (sectionQuestions.length === 0) return [];

    return [{
      section,
      sectionLabel: getTryoutSectionMeta(section).labelRomaji,
      correct: sectionQuestions.filter((question) => question.isCorrect).length,
      total: sectionQuestions.length,
    }];
  });

  return { questions, sectionBreakdown };
}

export async function analyzeTryoutAttempt(
  attempt: AttemptInput,
): Promise<AnalyzedTryoutAttempt | null> {
  const level = attempt.tryoutLevel ?? attempt.tryoutSession?.level;
  if (!level) return null;

  const details = await buildTryoutAttemptDetails(attempt);
  if (!details) return null;

  const correct =
    attempt.correctCount ?? details.questions.filter((question) => question.isCorrect).length;
  const total = attempt.totalQuestions ?? details.questions.length;
  if (total === 0) return null;

  const analysis = buildJlptCefrAnalysis({
    level,
    correct,
    total,
    sectionBreakdown: details.sectionBreakdown,
  });

  return {
    attemptId: attempt.id,
    level,
    createdAt: attempt.createdAt,
    scaledTotalScore: analysis.scaledTotalScore,
    jlptPassOverall: analysis.jlptPassOverall,
    totalPassScore: analysis.totalPassScore,
    totalPassPercent: analysis.totalPassPercent,
  };
}
