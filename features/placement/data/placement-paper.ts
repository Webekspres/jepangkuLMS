import { PLACEMENT_BUNPOU_QUESTIONS } from './placement-bunpou.generated';
import { PLACEMENT_CHOKAI_STUB_QUESTIONS } from './placement-chokai-stub';
import type { PlacementPaper } from './types';

/**
 * Active placement paper = Bunpou (from Excel) + Choukai stubs (UI preview).
 * Regen Bunpou: bun run placement:generate
 */
export const PLACEMENT_PAPER: PlacementPaper = {
  id: 'placement-n5-v1',
  title: 'Tes Penempatan JepangKu',
  version: 1,
  chokaiAudioUrl: '/placement/audio/JepangKu%20Placement%20Test.mp3',
  questions: [...PLACEMENT_BUNPOU_QUESTIONS, ...PLACEMENT_CHOKAI_STUB_QUESTIONS],
};

export const PLACEMENT_SECTION_META: Record<
  'MOJI_GOI' | 'BUNPOU_DOKKAI' | 'CHOKAI',
  { title: string; short: string; colorClass: string }
> = {
  MOJI_GOI: {
    title: '文字・語彙',
    short: 'Moji · Goi',
    colorClass: 'bg-blue-500',
  },
  BUNPOU_DOKKAI: {
    title: '文法・読解',
    short: 'Bunpou · Dokkai',
    colorClass: 'bg-violet-500',
  },
  CHOKAI: {
    title: '聴解',
    short: 'Choukai',
    colorClass: 'bg-emerald-500',
  },
};
