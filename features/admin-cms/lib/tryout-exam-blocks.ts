/**
 * Exam presentation blocks by JLPT level.
 * Storage stays MOJI_GOI | BUNPOU_DOKKAI | CHOKAI; N1/N2 merge vocab+grammar into one block.
 */
import type { LevelJLPT } from '@prisma/client';
import type { TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';

export type TryoutExamBlockId =
  | 'VOCAB'
  | 'GRAMMAR_READING'
  | 'LANG_READING'
  | 'LISTENING';

export type TryoutExamBlock = {
  id: TryoutExamBlockId;
  /** Full English label (jlpt.jp style). */
  label: string;
  /** Shorter label for chips / CMS tabs. */
  shortLabel: string;
  description: string;
  /** DB section codes included in this block (exam order preserved by sortTryoutExamQuestions). */
  sections: TryoutSectionValue[];
  color: string;
};

const BLOCK_VOCAB: TryoutExamBlock = {
  id: 'VOCAB',
  label: 'Language Knowledge (Vocabulary)',
  shortLabel: 'Vocabulary',
  description: 'Kosakata & kanji — pilih jawaban yang paling tepat.',
  sections: ['MOJI_GOI'],
  color: 'bg-blue-500',
};

const BLOCK_GRAMMAR_READING: TryoutExamBlock = {
  id: 'GRAMMAR_READING',
  label: 'Language Knowledge (Grammar) · Reading',
  shortLabel: 'Grammar · Reading',
  description: 'Tata bahasa dan pemahaman bacaan.',
  sections: ['BUNPOU_DOKKAI'],
  color: 'bg-violet-500',
};

const BLOCK_LANG_READING: TryoutExamBlock = {
  id: 'LANG_READING',
  label: 'Language Knowledge (Vocabulary/Grammar) · Reading',
  shortLabel: 'Vocab / Grammar · Reading',
  description: 'Kosakata, tata bahasa, dan bacaan dalam satu bagian (format N1–N2).',
  sections: ['MOJI_GOI', 'BUNPOU_DOKKAI'],
  color: 'bg-indigo-500',
};

const BLOCK_LISTENING: TryoutExamBlock = {
  id: 'LISTENING',
  label: 'Listening',
  shortLabel: 'Listening',
  description: 'Dengarkan audio dengan seksama sebelum menjawab.',
  sections: ['CHOKAI'],
  color: 'bg-emerald-500',
};

export function isCombinedLanguageKnowledgeLevel(level: string): boolean {
  const upper = level.trim().toUpperCase();
  return upper === 'N1' || upper === 'N2';
}

/** Official JLPT session layout for a package level. */
export function getTryoutExamBlocks(level: LevelJLPT | string): TryoutExamBlock[] {
  if (isCombinedLanguageKnowledgeLevel(level)) {
    return [BLOCK_LANG_READING, BLOCK_LISTENING];
  }
  return [BLOCK_VOCAB, BLOCK_GRAMMAR_READING, BLOCK_LISTENING];
}

/** Blocks that have at least one question in the paper. */
export function getActiveTryoutExamBlocks(
  level: LevelJLPT | string,
  questions: { section: string }[],
): TryoutExamBlock[] {
  return getTryoutExamBlocks(level).filter((block) =>
    questions.some((q) => block.sections.includes(q.section as TryoutSectionValue)),
  );
}

export function getTryoutExamBlockForSection(
  level: LevelJLPT | string,
  section: string,
): TryoutExamBlock | null {
  return (
    getTryoutExamBlocks(level).find((b) =>
      b.sections.includes(section as TryoutSectionValue),
    ) ?? null
  );
}

export function questionsInExamBlock<T extends { section: string }>(
  questions: T[],
  block: TryoutExamBlock,
): T[] {
  const set = new Set(block.sections);
  return questions.filter((q) => set.has(q.section as TryoutSectionValue));
}
