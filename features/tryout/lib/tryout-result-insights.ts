import type { TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';
import type { TryoutAttemptReview } from '@/features/tryout/lib/load-tryout-review';
import {
  buildJlptCefrAnalysis,
  type CefrLevel,
  type JlptCefrAnalysis,
  simulationSectionMinToPass,
} from '@/features/tryout/lib/jlpt-cefr-reference';

export type { CefrLevel, JlptCefrAnalysis };
export { buildJlptCefrAnalysis };

/** Ambang XP/badge tryout (backend) — tidak ditampilkan sebagai verdict UI. */
export const SIMULATION_PASS_PERCENT = 60;

export type TryoutFeedback = {
  headline: string;
  feedback: string;
  sectionNote: string | null;
  sectionNoteEmphasis: string | null;
  tips: string[];
};

export type TryoutSectionAnalysisRow = {
  section: TryoutSectionValue;
  sectionLabel: string;
  correct: number;
  total: number;
  minToPass: number;
  passed: boolean;
  wrongCount: number;
};

/** Ambang minimal benar per bagian simulasi (~32%, selaras JLPT 19/60). */
export function sectionMinToPass(total: number): number {
  return simulationSectionMinToPass(total);
}

export function getJlptPassFailReason(
  analysis: Pick<
    JlptCefrAnalysis,
    'jlptPassOverall' | 'meetsJlptTotalPass' | 'meetsAllSectionalPass'
  >,
): string | null {
  if (analysis.jlptPassOverall) return null;
  if (!analysis.meetsJlptTotalPass && !analysis.meetsAllSectionalPass) {
    return 'Skor total dan beberapa bagian belum memenuhi ambang minimal.';
  }
  if (!analysis.meetsJlptTotalPass) {
    return 'Skor total belum mencapai ambang minimal kelulusan.';
  }
  return 'Ada bagian ujian yang belum mencapai ambang minimal.';
}

export function buildTryoutFeedback(input: {
  correct: number;
  total: number;
  sectionRows: TryoutSectionAnalysisRow[];
  jlptPassOverall: boolean;
  meetsJlptTotalPass: boolean;
  meetsAllSectionalPass: boolean;
  indicatedCefr: CefrLevel | null;
  level: string;
}): TryoutFeedback {
  const wrongCount = input.total - input.correct;
  const isPerfect = input.total > 0 && wrongCount === 0;
  const weakestSection = getWeakestSectionLabel(input.sectionRows);
  const failReason = getJlptPassFailReason({
    jlptPassOverall: input.jlptPassOverall,
    meetsJlptTotalPass: input.meetsJlptTotalPass,
    meetsAllSectionalPass: input.meetsAllSectionalPass,
  });

  if (isPerfect) {
    return {
      headline: 'Skor sempurna — performa luar biasa!',
      feedback: input.indicatedCefr
        ? `Kamu menjawab semua soal benar. Skor setara JLPT memenuhi indikasi CEFR ${input.indicatedCefr} untuk level ${input.level}.`
        : `Kamu menjawab semua soal benar. Pertahankan konsistensi saat menghadapi ujian dengan jumlah soal penuh.`,
      sectionNote: 'Semua bagian ujian terjawab benar.',
      sectionNoteEmphasis: null,
      tips: input.jlptPassOverall
        ? [
            'Pertahankan ritme belajar dan pertimbangkan tryout level berikutnya.',
            'Gunakan referensi CEFR di bawah untuk memantau perkembangan kemampuan.',
          ]
        : [
            'Lanjutkan latihan rutin agar konsisten di ujian sesungguhnya.',
            'Periksa analisa kelulusan per bagian JLPT di bawah untuk memastikan semua ambang resmi terpenuhi.',
          ],
    };
  }

  if (input.jlptPassOverall) {
    return {
      headline: `Selamat — kamu memenuhi syarat kelulusan JLPT ${input.level}.`,
      feedback: input.indicatedCefr
        ? `Skor setara dan semua bagian ujian memenuhi ambang resmi. Indikasi CEFR saat ini: ${input.indicatedCefr}.`
        : `Skor setara dan semua bagian ujian memenuhi ambang resmi untuk level ${input.level}.`,
      sectionNote: weakestSection ? 'Bagian yang masih bisa diperkuat:' : 'Semua bagian memenuhi ambang minimal.',
      sectionNoteEmphasis: weakestSection,
      tips: [
        ...(wrongCount > 0
          ? ['Review soal yang masih salah di bawah untuk memperkuat area lemah.']
          : []),
        'Pertahankan konsistensi di setiap bagian JLPT.',
        'Coba sesi tryout berikutnya atau ulangi dengan timer lebih ketat.',
      ],
    };
  }

  const cefrNote = input.indicatedCefr
    ? ` Indikasi CEFR ${input.indicatedCefr} mengikuti skor total saja — kelulusan resmi masih menunggu semua bagian memenuhi ambang.`
    : '';

  return {
    headline: `Belum memenuhi syarat kelulusan JLPT ${input.level}.`,
    feedback: `${failReason ?? 'Ambang resmi JLPT belum terpenuhi.'}${cefrNote}`,
    sectionNote: weakestSection ? 'Mulai perbaikan dari:' : null,
    sectionNoteEmphasis: weakestSection,
    tips: [
      'Kuatkan kosakata & kanji dasar di MOJI GOI terlebih dahulu.',
      'Untuk BUNPOU DOKKAI, catat pola tata bahasa dari soal yang salah.',
      'CHOKAI: latih menangkap kata kunci dari audio atau konteks soal.',
      ...(wrongCount > 0
        ? ['Pelajari penjelasan tiap soal salah sebelum mencoba lagi.']
        : []),
    ],
  };
}

export function buildSectionAnalysisRows(
  review: Pick<TryoutAttemptReview, 'sectionBreakdown' | 'questions'>,
): TryoutSectionAnalysisRow[] {
  return review.sectionBreakdown.map((row) => {
    const wrongCount = review.questions.filter(
      (q) => q.section === row.section && !q.isCorrect,
    ).length;
    const minToPass = sectionMinToPass(row.total);
    return {
      section: row.section,
      sectionLabel: row.sectionLabel,
      correct: row.correct,
      total: row.total,
      minToPass,
      passed: row.correct >= minToPass,
      wrongCount,
    };
  });
}

export function getWeakestSectionLabel(rows: TryoutSectionAnalysisRow[]): string | null {
  if (rows.length === 0) return null;

  const withIssues = rows.filter((row) => row.wrongCount > 0 || !row.passed);
  if (withIssues.length === 0) return null;

  const sorted = [...withIssues].sort((a, b) => {
    const ratioA = a.total > 0 ? a.correct / a.total : 0;
    const ratioB = b.total > 0 ? b.correct / b.total : 0;
    if (ratioA !== ratioB) return ratioA - ratioB;
    return b.wrongCount - a.wrongCount;
  });
  return sorted[0]?.sectionLabel ?? null;
}

export function getRevealMessage(pass: boolean): string {
  if (pass) {
    return 'Hebat! Kamu memenuhi syarat kelulusan JLPT. Lihat analisa lengkap untuk detail skor dan CEFR.';
  }
  return 'Belum memenuhi syarat kelulusan JLPT. Lihat analisa di bawah untuk tahu skor total, bagian yang kurang, dan indikasi CEFR.';
}
