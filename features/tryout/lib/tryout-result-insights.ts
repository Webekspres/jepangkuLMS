import type { TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';
import type { TryoutAttemptReview } from '@/features/tryout/lib/load-tryout-review';

export type TryoutStatusTier = {
  code: 'AMAN' | 'PERLU_LATIHAN' | 'SOS';
  label: string;
  passRateEstimate: number;
  headline: string;
  feedback: string;
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

/** Ambang minimal benar per bagian — simulasi 60% (bukan skor JLPT resmi). */
export function sectionMinToPass(total: number): number {
  if (total <= 0) return 0;
  return Math.ceil(total * 0.6);
}

export function getTryoutStatusTier(scorePercent: number): TryoutStatusTier {
  if (scorePercent >= 60) {
    return {
      code: 'AMAN',
      label: 'Aman',
      passRateEstimate: 78,
      headline: 'Skor kamu berada pada tingkat aman untuk simulasi ini.',
      feedback:
        'Performa keseluruhan sudah mendekati target kelulusan simulasi (≥60%). Pertahankan konsistensi per bagian JLPT.',
      tips: [
        'Review soal yang masih salah di bawah untuk memperkuat area lemah.',
        'Coba sesi tryout level berikutnya atau ulangi dengan timer lebih ketat.',
      ],
    };
  }

  if (scorePercent >= 40) {
    return {
      code: 'PERLU_LATIHAN',
      label: 'Perlu Latihan',
      passRateEstimate: 48,
      headline: 'Skor kamu masih di zona perlu latihan intensif.',
      feedback:
        'Berdasarkan pola simulasi internal, peserta dengan skor serupa membutuhkan penguatan 1–2 bagian utama sebelum ujian sesungguhnya.',
      tips: [
        'Fokuskan belajar pada bagian dengan benar di bawah ambang minimal.',
        'Kerjakan ulang materi kursus yang terkait bagian terlemah.',
        'Gunakan mode tryout lagi setelah review penjelasan tiap soal.',
      ],
    };
  }

  return {
    code: 'SOS',
    label: 'SOS',
    passRateEstimate: 28,
    headline: 'Skor kamu saat ini berada pada tingkat SOS.',
    feedback:
      'Hasil ini menunjukkan fondasi di beberapa bagian masih perlu dibangun. Simulasi ini untuk belajar — manfaatkan analisa di bawah sebagai peta latihan.',
    tips: [
      'Mulai dari MOJI GOI: kuasakan kosakata & kanji dasar level ini.',
      'Untuk BUNPOU DOKKAI, baca penjelasan setiap soal salah dan catat pola tata bahasa.',
      'CHOKAI: dengarkan ulang audio dan latih menangkap kata kunci.',
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
  const sorted = [...rows].sort((a, b) => {
    const ratioA = a.total > 0 ? a.correct / a.total : 0;
    const ratioB = b.total > 0 ? b.correct / b.total : 0;
    return ratioA - ratioB;
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
