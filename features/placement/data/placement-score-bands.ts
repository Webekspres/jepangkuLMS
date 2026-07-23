import type { PlacementScoreBand } from './types';

/**
 * Paper diagnostik saat ini selevel N5–N4.
 * Rekomendasi hanya N5 / N4 — skor tinggi = siap jalur N4, bukan “setara N2/N1”.
 */
export const PLACEMENT_SCORE_BANDS: PlacementScoreBand[] = [
  {
    minPercent: 0,
    maxPercent: 64,
    level: 'N5',
    blurb:
      'Fondasi belum solid di material N5–N4. Mulai atau lanjutkan jalur N5 — hiragana, kosakata dasar, dan pola kalimat sederhana.',
  },
  {
    minPercent: 65,
    maxPercent: 100,
    level: 'N4',
    blurb:
      'Kamu menguasai material N5–N4 di tes diagnostik ini. Pertimbangkan jalur N4 untuk memperkuat tata bahasa dan kosakata sehari-hari.',
  },
];

export function resolvePlacementLevel(scorePercent: number): PlacementScoreBand {
  const clamped = Math.max(0, Math.min(100, Math.round(scorePercent)));
  const band = PLACEMENT_SCORE_BANDS.find(
    (b) => clamped >= b.minPercent && clamped <= b.maxPercent,
  );
  return band ?? PLACEMENT_SCORE_BANDS[0]!;
}
