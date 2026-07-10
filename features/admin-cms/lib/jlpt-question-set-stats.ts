/**
 * Derived Paket Soal stats (not persisted) + soft-lock / activate helpers.
 */
import type { LevelJLPT, TryoutSectionCode } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type JlptCompleteness = {
  moji: boolean;
  bunpou: boolean;
  chokai: boolean;
  /** e.g. "2/3" */
  label: string;
  isComplete: boolean;
};

export type JlptQuestionSetDerivedStats = {
  totalQuestions: number;
  mojiCount: number;
  bunpouCount: number;
  chokaiCount: number;
  activeSessionCount: number;
  isContentLocked: boolean;
  jlptCompleteness: JlptCompleteness;
};

type CountableItem = {
  section: TryoutSectionCode;
  jlptQuestionId: string | null;
  listeningStimulus: { _count: { questions: number } } | null;
};

export function countFlattenedBySection(items: CountableItem[]): {
  mojiCount: number;
  bunpouCount: number;
  chokaiCount: number;
  totalQuestions: number;
} {
  let mojiCount = 0;
  let bunpouCount = 0;
  let chokaiCount = 0;

  for (const item of items) {
    const n = item.listeningStimulus
      ? item.listeningStimulus._count.questions
      : item.jlptQuestionId
        ? 1
        : 0;
    if (item.section === 'MOJI_GOI') mojiCount += n;
    else if (item.section === 'BUNPOU_DOKKAI') bunpouCount += n;
    else if (item.section === 'CHOKAI') chokaiCount += n;
  }

  return {
    mojiCount,
    bunpouCount,
    chokaiCount,
    totalQuestions: mojiCount + bunpouCount + chokaiCount,
  };
}

export function buildJlptCompleteness(counts: {
  mojiCount: number;
  bunpouCount: number;
  chokaiCount: number;
}): JlptCompleteness {
  const moji = counts.mojiCount > 0;
  const bunpou = counts.bunpouCount > 0;
  const chokai = counts.chokaiCount > 0;
  const filled = [moji, bunpou, chokai].filter(Boolean).length;
  return {
    moji,
    bunpou,
    chokai,
    label: `${filled}/3`,
    isComplete: filled === 3,
  };
}

export async function getActiveSessionCountForSet(questionSetId: string): Promise<number> {
  return prisma.tryoutSession.count({
    where: { questionSetId, isActive: true },
  });
}

export async function isQuestionSetContentLocked(questionSetId: string): Promise<boolean> {
  const n = await getActiveSessionCountForSet(questionSetId);
  return n > 0;
}

export function contentLockedMessage(title: string, activeCount: number): string {
  return `Paket "${title}" dipakai ${activeCount} sesi aktif. Duplikat untuk mengedit, atau nonaktifkan sesi terlebih dahulu.`;
}

/**
 * Validate package can become READY (≥1 item, no integrity errors on existing items).
 */
export async function validateQuestionSetForReady(
  questionSetId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const set = await prisma.jlptQuestionSet.findUnique({
    where: { id: questionSetId },
    include: {
      items: {
        include: {
          jlptQuestion: true,
          listeningStimulus: {
            include: {
              questions: { where: { status: { not: 'RETIRED' } } },
            },
          },
        },
      },
    },
  });
  if (!set) return { ok: false, message: 'Paket tidak ditemukan.' };
  if (set.items.length === 0) {
    return { ok: false, message: 'Paket harus punya minimal 1 item sebelum READY.' };
  }

  const seenQuestions = new Set<string>();
  const seenStimuli = new Set<string>();

  for (const item of set.items) {
    const hasQ = Boolean(item.jlptQuestionId);
    const hasS = Boolean(item.listeningStimulusId);
    if (hasQ === hasS) {
      return { ok: false, message: 'Setiap item harus tepat satu: soal ATAU stimulus.' };
    }

    if (item.section === 'CHOKAI' && item.listeningStimulusId && item.listeningStimulus) {
      if (item.listeningStimulus.status === 'RETIRED') {
        return { ok: false, message: `Stimulus ${item.listeningStimulus.code} sudah RETIRED.` };
      }
      if (item.listeningStimulus.level !== set.level) {
        return { ok: false, message: `Level stimulus tidak cocok dengan paket (${set.level}).` };
      }
      if (item.listeningStimulus.questions.length === 0) {
        return {
          ok: false,
          message: `Stimulus ${item.listeningStimulus.code} belum punya soal aktif.`,
        };
      }
      if (seenStimuli.has(item.listeningStimulusId)) {
        return { ok: false, message: 'Stimulus duplikat dalam paket.' };
      }
      seenStimuli.add(item.listeningStimulusId);
      continue;
    }

    if (!item.jlptQuestionId || !item.jlptQuestion) {
      return { ok: false, message: `Item ${item.section} wajib soal bank.` };
    }
    const q = item.jlptQuestion;
    if (q.status === 'RETIRED') {
      return { ok: false, message: `Soal ${q.code} sudah RETIRED.` };
    }
    if (q.level !== set.level) {
      return { ok: false, message: `Level soal ${q.code} tidak cocok dengan paket.` };
    }
    if (q.section !== item.section) {
      return { ok: false, message: `Section soal ${q.code} tidak cocok dengan item.` };
    }
    if (seenQuestions.has(item.jlptQuestionId)) {
      return { ok: false, message: `Soal ${q.code} duplikat dalam paket.` };
    }
    seenQuestions.add(item.jlptQuestionId);
  }

  return { ok: true };
}

/**
 * Gate for Session isActive=true — READY + level match + full JLPT (3 sections).
 */
export async function validateSessionActivate(
  sessionId: string,
  opts?: { questionSetId?: string | null; level?: LevelJLPT },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await prisma.tryoutSession.findUnique({
    where: { id: sessionId },
    select: { id: true, level: true, questionSetId: true, title: true },
  });
  if (!session) return { ok: false, message: 'Sesi tidak ditemukan.' };

  const questionSetId = opts?.questionSetId !== undefined ? opts.questionSetId : session.questionSetId;
  const level = opts?.level ?? session.level;

  if (!questionSetId) {
    return { ok: false, message: 'Pilih Paket Soal sebelum mengaktifkan sesi.' };
  }

  const set = await prisma.jlptQuestionSet.findUnique({
    where: { id: questionSetId },
    include: {
      items: {
        include: {
          listeningStimulus: { select: { _count: { select: { questions: true } } } },
        },
      },
    },
  });
  if (!set) return { ok: false, message: 'Paket Soal tidak ditemukan.' };
  if (set.status !== 'READY') {
    return { ok: false, message: `Paket harus berstatus READY (sekarang: ${set.status}).` };
  }
  if (set.level !== level) {
    return {
      ok: false,
      message: `Level paket (${set.level}) harus sama dengan level sesi (${level}).`,
    };
  }

  const readyCheck = await validateQuestionSetForReady(questionSetId);
  if (!readyCheck.ok) return readyCheck;

  const counts = countFlattenedBySection(set.items);
  const completeness = buildJlptCompleteness(counts);
  if (!completeness.isComplete) {
    const missing: string[] = [];
    if (!completeness.moji) missing.push('MOJI GOI');
    if (!completeness.bunpou) missing.push('BUNPOU DOKKAI');
    if (!completeness.chokai) missing.push('CHOKAI');
    return {
      ok: false,
      message: `Sesi aktif membutuhkan ketiga bagian JLPT. Belum ada: ${missing.join(', ')}.`,
    };
  }

  return { ok: true };
}
