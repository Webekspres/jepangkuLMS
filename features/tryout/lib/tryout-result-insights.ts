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

export type TryoutStatusTier = {
  code: 'AMAN' | 'PERLU_LATIHAN' | 'SOS';
  label: string;
};

/** Ambang lulus simulasi internal (XP/badge) — terpisah dari standar JLPT resmi. */
export const SIMULATION_PASS_PERCENT = 60;

export type TryoutFeedback = {
  tier: TryoutStatusTier;
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

export function getTryoutStatusTier(scorePercent: number): TryoutStatusTier {
  if (scorePercent >= SIMULATION_PASS_PERCENT) {
    return { code: 'AMAN', label: 'Aman' };
  }
  if (scorePercent >= 40) {
    return { code: 'PERLU_LATIHAN', label: 'Perlu Latihan' };
  }
  return { code: 'SOS', label: 'SOS' };
}

export function buildTryoutFeedback(input: {
  scorePercent: number;
  correct: number;
  total: number;
  sectionRows: TryoutSectionAnalysisRow[];
  jlptPassOverall: boolean;
  indicatedCefr: CefrLevel | null;
  level: string;
}): TryoutFeedback {
  const tier = getTryoutStatusTier(input.scorePercent);
  const wrongCount = input.total - input.correct;
  const isPerfect = input.total > 0 && wrongCount === 0;
  const weakestSection = getWeakestSectionLabel(input.sectionRows);
  const failedSections = input.sectionRows.filter((row) => !row.passed);

  if (isPerfect) {
    return {
      tier,
      headline: 'Skor sempurna — performa luar biasa!',
      feedback: input.indicatedCefr
        ? `Kamu menjawab semua soal benar. Skor setara JLPT memenuhi indikasi CEFR ${input.indicatedCefr} untuk level ${input.level}.`
        : `Kamu menjawab semua soal benar dalam simulasi ini. Pertahankan konsistensi saat menghadapi ujian dengan jumlah soal penuh.`,
      sectionNote: 'Semua bagian simulasi terjawab benar.',
      sectionNoteEmphasis: null,
      tips: input.jlptPassOverall
        ? [
            'Pertahankan ritme belajar dan pertimbangkan tryout level berikutnya.',
            'Gunakan referensi CEFR di bawah untuk memantau perkembangan kemampuan.',
          ]
        : [
            'Skor simulasi sempurna — lanjutkan latihan rutin agar konsisten di ujian sesungguhnya.',
            'Periksa analisa kelulusan per bagian JLPT di bawah untuk memastikan semua ambang resmi terpenuhi.',
          ],
    };
  }

  if (tier.code === 'AMAN') {
    return {
      tier,
      headline: 'Skor kamu berada pada tingkat aman untuk simulasi ini.',
      feedback: input.jlptPassOverall
        ? `Performa keseluruhan memenuhi ambang simulasi (≥${SIMULATION_PASS_PERCENT}%) dan syarat kelulusan JLPT untuk level ${input.level}.`
        : `Performa keseluruhan memenuhi ambang simulasi (≥${SIMULATION_PASS_PERCENT}%), namun masih ada bagian yang belum memenuhi ambang kelulusan JLPT resmi.`,
      sectionNote: weakestSection
        ? 'Bagian paling perlu diperkuat:'
        : failedSections.length === 0
          ? 'Semua bagian simulasi memenuhi ambang minimal.'
          : null,
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

  if (tier.code === 'PERLU_LATIHAN') {
    return {
      tier,
      headline: 'Skor kamu masih di zona perlu latihan intensif.',
      feedback: `Hasil di bawah ambang aman simulasi (${SIMULATION_PASS_PERCENT}%). Fokuskan penguatan pada bagian yang masih di bawah ambang minimal.`,
      sectionNote: weakestSection ? 'Bagian paling perlu diperkuat:' : null,
      sectionNoteEmphasis: weakestSection,
      tips: [
        'Kerjakan ulang materi kursus yang terkait bagian terlemah.',
        ...(wrongCount > 0
          ? ['Pelajari penjelasan tiap soal salah sebelum mencoba lagi.']
          : []),
        'Gunakan mode tryout lagi setelah review.',
      ],
    };
  }

  return {
    tier,
    headline: 'Skor kamu saat ini berada pada tingkat SOS.',
    feedback:
      'Fondasi di beberapa bagian masih perlu dibangun. Manfaatkan analisa di bawah sebagai peta latihan.',
    sectionNote: weakestSection ? 'Mulai perbaikan dari:' : null,
    sectionNoteEmphasis: weakestSection,
    tips: [
      'Kuatkan kosakata & kanji dasar di MOJI GOI terlebih dahulu.',
      'Untuk BUNPOU DOKKAI, catat pola tata bahasa dari soal yang salah.',
      'CHOKAI: latih menangkap kata kunci dari audio atau konteks soal.',
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

export function getRevealMessage(pass: boolean, score: number): string {
  if (pass) {
    return 'Hebat! Kamu melewati ambang simulasi. Terus asah skill di analisa lengkap.';
  }
  if (score >= 40) {
    return 'Kurang sedikit lagi! Yuk review jawaban dan latihan lagi bareng JepangKu.';
  }
  return 'Jangan menyerah! Setiap tryout adalah langkah belajar — lihat analisa untuk tahu fokus latihan.';
}
