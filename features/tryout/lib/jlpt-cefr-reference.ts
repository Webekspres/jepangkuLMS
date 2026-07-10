import type { LevelJLPT } from '@prisma/client';
import type { TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';

/** Skor total maksimal ujian JLPT resmi. */
export const JLPT_TOTAL_MAX_SCORE = 180;

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type JlptOfficialSectionKey = 'LANGUAGE_READING' | 'LANGUAGE' | 'READING' | 'LISTENING';

export type JlptSectionGroupConfig = {
  key: JlptOfficialSectionKey;
  label: string;
  maxScore: number;
  minPassScore: number;
  sections: TryoutSectionValue[];
};

export type JlptCefrBand = {
  cefr: CefrLevel;
  minScaledScore: number;
  maxScaledScore: number | null;
  description: string;
};

export type JlptLevelCefrConfig = {
  totalPassScore: number;
  totalPassPercent: number;
  sectionGroups: JlptSectionGroupConfig[];
  cefrBands: JlptCefrBand[];
};

const SECTION_MIN_RATIO = 19 / 60;

/** Konfigurasi resmi JLPT × CEFR (Japan Foundation / JLPT scoring guidance). */
export const JLPT_CEFR_BY_LEVEL: Record<LevelJLPT, JlptLevelCefrConfig> = {
  N5: {
    totalPassScore: 80,
    totalPassPercent: 44,
    sectionGroups: [
      {
        key: 'LANGUAGE_READING',
        label: 'Pengetahuan Bahasa & Membaca',
        maxScore: 120,
        minPassScore: 38,
        sections: ['MOJI_GOI', 'BUNPOU_DOKKAI'],
      },
      {
        key: 'LISTENING',
        label: 'Mendengarkan (Listening)',
        maxScore: 60,
        minPassScore: 19,
        sections: ['CHOKAI'],
      },
    ],
    cefrBands: [{ cefr: 'A1', minScaledScore: 80, maxScaledScore: null, description: 'Skor ≥ 80' }],
  },
  N4: {
    totalPassScore: 90,
    totalPassPercent: 50,
    sectionGroups: [
      {
        key: 'LANGUAGE_READING',
        label: 'Pengetahuan Bahasa & Membaca',
        maxScore: 120,
        minPassScore: 38,
        sections: ['MOJI_GOI', 'BUNPOU_DOKKAI'],
      },
      {
        key: 'LISTENING',
        label: 'Mendengarkan (Listening)',
        maxScore: 60,
        minPassScore: 19,
        sections: ['CHOKAI'],
      },
    ],
    cefrBands: [{ cefr: 'A2', minScaledScore: 90, maxScaledScore: null, description: 'Skor ≥ 90' }],
  },
  N3: {
    totalPassScore: 95,
    totalPassPercent: 53,
    sectionGroups: [
      {
        key: 'LANGUAGE',
        label: 'Pengetahuan Bahasa',
        maxScore: 60,
        minPassScore: 19,
        sections: ['MOJI_GOI'],
      },
      {
        key: 'READING',
        label: 'Membaca (Reading)',
        maxScore: 60,
        minPassScore: 19,
        sections: ['BUNPOU_DOKKAI'],
      },
      {
        key: 'LISTENING',
        label: 'Mendengarkan (Listening)',
        maxScore: 60,
        minPassScore: 19,
        sections: ['CHOKAI'],
      },
    ],
    cefrBands: [
      { cefr: 'A2', minScaledScore: 95, maxScaledScore: 103, description: 'Skor 95 – 103' },
      { cefr: 'B1', minScaledScore: 104, maxScaledScore: null, description: 'Skor ≥ 104' },
    ],
  },
  N2: {
    totalPassScore: 90,
    totalPassPercent: 50,
    sectionGroups: [
      {
        key: 'LANGUAGE',
        label: 'Pengetahuan Bahasa',
        maxScore: 60,
        minPassScore: 19,
        sections: ['MOJI_GOI'],
      },
      {
        key: 'READING',
        label: 'Membaca (Reading)',
        maxScore: 60,
        minPassScore: 19,
        sections: ['BUNPOU_DOKKAI'],
      },
      {
        key: 'LISTENING',
        label: 'Mendengarkan (Listening)',
        maxScore: 60,
        minPassScore: 19,
        sections: ['CHOKAI'],
      },
    ],
    cefrBands: [
      { cefr: 'B1', minScaledScore: 90, maxScaledScore: 111, description: 'Skor 90 – 111' },
      { cefr: 'B2', minScaledScore: 112, maxScaledScore: null, description: 'Skor ≥ 112' },
    ],
  },
  N1: {
    totalPassScore: 100,
    totalPassPercent: 56,
    sectionGroups: [
      {
        key: 'LANGUAGE',
        label: 'Pengetahuan Bahasa',
        maxScore: 60,
        minPassScore: 19,
        sections: ['MOJI_GOI'],
      },
      {
        key: 'READING',
        label: 'Membaca (Reading)',
        maxScore: 60,
        minPassScore: 19,
        sections: ['BUNPOU_DOKKAI'],
      },
      {
        key: 'LISTENING',
        label: 'Mendengarkan (Listening)',
        maxScore: 60,
        minPassScore: 19,
        sections: ['CHOKAI'],
      },
    ],
    cefrBands: [
      { cefr: 'B2', minScaledScore: 100, maxScaledScore: 141, description: 'Skor 100 – 141' },
      { cefr: 'C1', minScaledScore: 142, maxScaledScore: null, description: 'Skor ≥ 142' },
    ],
  },
};

export function getJlptLevelCefrConfig(level: LevelJLPT): JlptLevelCefrConfig {
  return JLPT_CEFR_BY_LEVEL[level];
}

/** Proyeksikan hasil simulasi ke skala total JLPT (0–180). */
export function scaleToJlptTotalScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * JLPT_TOTAL_MAX_SCORE);
}

/** Proyeksikan benar/total bagian ke skala resmi bagian JLPT. */
export function scaleToJlptSectionScore(
  correct: number,
  total: number,
  sectionMaxScore: number,
): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * sectionMaxScore);
}

/** Ambang minimal benar per grup bagian — proporsional ke JLPT resmi (~32% per bagian). */
export function sectionGroupMinToPass(totalQuestions: number, minPassScore: number, maxScore: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.ceil(totalQuestions * (minPassScore / maxScore));
}

/** Fallback simulasi: ~32% benar per bagian (19/60 JLPT). */
export function simulationSectionMinToPass(totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.ceil(totalQuestions * SECTION_MIN_RATIO);
}

export function resolveIndicatedCefr(
  level: LevelJLPT,
  scaledTotalScore: number,
): { cefr: CefrLevel | null; bandDescription: string | null } {
  const config = getJlptLevelCefrConfig(level);
  if (scaledTotalScore < config.totalPassScore) {
    return { cefr: null, bandDescription: null };
  }

  for (const band of config.cefrBands) {
    const withinMax =
      band.maxScaledScore == null || scaledTotalScore <= band.maxScaledScore;
    if (scaledTotalScore >= band.minScaledScore && withinMax) {
      return { cefr: band.cefr, bandDescription: band.description };
    }
  }

  const last = config.cefrBands[config.cefrBands.length - 1];
  return { cefr: last?.cefr ?? null, bandDescription: last?.description ?? null };
}

export type JlptOfficialSectionRow = {
  key: JlptOfficialSectionKey;
  label: string;
  correct: number;
  total: number;
  minToPass: number;
  scaledScore: number;
  scaledMax: number;
  scaledMinPass: number;
  passed: boolean;
};

export function buildJlptOfficialSectionRows(
  level: LevelJLPT,
  sectionBreakdown: Array<{
    section: TryoutSectionValue;
    correct: number;
    total: number;
  }>,
): JlptOfficialSectionRow[] {
  const config = getJlptLevelCefrConfig(level);
  const bySection = new Map(sectionBreakdown.map((row) => [row.section, row]));

  return config.sectionGroups
    .map((group) => {
      const rows = group.sections
        .map((section) => bySection.get(section))
        .filter((row): row is NonNullable<typeof row> => Boolean(row) && row.total > 0);

      if (rows.length === 0) return null;

      const correct = rows.reduce((sum, row) => sum + row.correct, 0);
      const total = rows.reduce((sum, row) => sum + row.total, 0);
      const minToPass = sectionGroupMinToPass(total, group.minPassScore, group.maxScore);
      const scaledScore = scaleToJlptSectionScore(correct, total, group.maxScore);

      return {
        key: group.key,
        label: group.label,
        correct,
        total,
        minToPass,
        scaledScore,
        scaledMax: group.maxScore,
        scaledMinPass: group.minPassScore,
        passed: correct >= minToPass,
      };
    })
    .filter((row): row is JlptOfficialSectionRow => row != null);
}

export type JlptCefrAnalysis = {
  scaledTotalScore: number;
  indicatedCefr: CefrLevel | null;
  cefrBandDescription: string | null;
  meetsJlptTotalPass: boolean;
  meetsAllSectionalPass: boolean;
  jlptPassOverall: boolean;
  totalPassScore: number;
  totalPassPercent: number;
  officialSectionRows: JlptOfficialSectionRow[];
  cefrBands: JlptCefrBand[];
};

export function buildJlptCefrAnalysis(input: {
  level: LevelJLPT;
  correct: number;
  total: number;
  sectionBreakdown: Array<{
    section: TryoutSectionValue;
    correct: number;
    total: number;
  }>;
}): JlptCefrAnalysis {
  const config = getJlptLevelCefrConfig(input.level);
  const scaledTotalScore = scaleToJlptTotalScore(input.correct, input.total);
  const officialSectionRows = buildJlptOfficialSectionRows(input.level, input.sectionBreakdown);
  const meetsJlptTotalPass = scaledTotalScore >= config.totalPassScore;
  const meetsAllSectionalPass =
    officialSectionRows.length > 0 && officialSectionRows.every((row) => row.passed);
  const { cefr, bandDescription } = resolveIndicatedCefr(input.level, scaledTotalScore);

  return {
    scaledTotalScore,
    indicatedCefr: cefr,
    cefrBandDescription: bandDescription,
    meetsJlptTotalPass,
    meetsAllSectionalPass,
    jlptPassOverall: meetsJlptTotalPass && meetsAllSectionalPass,
    totalPassScore: config.totalPassScore,
    totalPassPercent: config.totalPassPercent,
    officialSectionRows,
    cefrBands: config.cefrBands,
  };
}

export function formatCefrBandRange(band: JlptCefrBand): string {
  if (band.maxScaledScore == null) {
    return `≥ ${band.minScaledScore}`;
  }
  return `${band.minScaledScore} – ${band.maxScaledScore}`;
}
