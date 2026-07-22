import { kanaAudioPath, kanaVocabAudioPath, kanaVocabImagePath } from './kana-asset-paths';
import {
  KANA_MANIFEST,
  type KanaManifestEntry,
} from './kana-manifest.generated';
import type {
  KanaCharacter,
  KanaChartData,
  KanaChartSection,
  KanaGridCell,
  KanaGroup,
  KanaScript,
  KanaVocab,
} from './kana-types';

const VOWEL_HEADERS = ['a', 'i', 'u', 'e', 'o'] as const;

/** Column indices (a/i/u/e/o) where each Excel category places its characters, in sheet order. */
type CategoryLayout = {
  section: 'gojuon' | 'dakuten' | 'yoon';
  rowId: string;
  /** Column slots filled left-to-right by successive rows in this category */
  slots: readonly number[];
  group: KanaGroup;
};

/**
 * Map Excel `Kategori` → chart row layout.
 * Yoon / Ya / Wa use sparse columns (a/u/o or a/o only).
 */
const CATEGORY_LAYOUT: Record<string, CategoryLayout> = {
  'Dasar (Vokal)': { section: 'gojuon', rowId: 'a-row', slots: [0, 1, 2, 3, 4], group: 'gojuon' },
  'Dasar (K)': { section: 'gojuon', rowId: 'ka-row', slots: [0, 1, 2, 3, 4], group: 'gojuon' },
  'Dasar (S)': { section: 'gojuon', rowId: 'sa-row', slots: [0, 1, 2, 3, 4], group: 'gojuon' },
  'Dasar (T)': { section: 'gojuon', rowId: 'ta-row', slots: [0, 1, 2, 3, 4], group: 'gojuon' },
  'Dasar (N)': { section: 'gojuon', rowId: 'na-row', slots: [0, 1, 2, 3, 4], group: 'gojuon' },
  'Dasar (H)': { section: 'gojuon', rowId: 'ha-row', slots: [0, 1, 2, 3, 4], group: 'gojuon' },
  'Dasar (M)': { section: 'gojuon', rowId: 'ma-row', slots: [0, 1, 2, 3, 4], group: 'gojuon' },
  'Dasar (Y)': { section: 'gojuon', rowId: 'ya-row', slots: [0, 2, 4], group: 'gojuon' },
  'Dasar (R)': { section: 'gojuon', rowId: 'ra-row', slots: [0, 1, 2, 3, 4], group: 'gojuon' },
  'Dasar (W)': { section: 'gojuon', rowId: 'wa-row', slots: [0, 4], group: 'gojuon' },
  'Dasar (N/M/Ng)': { section: 'gojuon', rowId: 'n-row', slots: [0], group: 'gojuon' },
  'Dakuon (G)': { section: 'dakuten', rowId: 'ga-row', slots: [0, 1, 2, 3, 4], group: 'dakuten' },
  'Dakuon (Z)': { section: 'dakuten', rowId: 'za-row', slots: [0, 1, 2, 3, 4], group: 'dakuten' },
  'Dakuon (D)': { section: 'dakuten', rowId: 'da-row', slots: [0, 1, 2, 3, 4], group: 'dakuten' },
  'Dakuon (B)': { section: 'dakuten', rowId: 'ba-row', slots: [0, 1, 2, 3, 4], group: 'dakuten' },
  'Handakuon (P)': {
    section: 'dakuten',
    rowId: 'pa-row',
    slots: [0, 1, 2, 3, 4],
    group: 'handakuten',
  },
  'Yoon (K)': { section: 'yoon', rowId: 'kya-row', slots: [0, 2, 4], group: 'yoon' },
  'Yoon (S)': { section: 'yoon', rowId: 'sha-row', slots: [0, 2, 4], group: 'yoon' },
  'Yoon (T)': { section: 'yoon', rowId: 'cha-row', slots: [0, 2, 4], group: 'yoon' },
  'Yoon (N)': { section: 'yoon', rowId: 'nya-row', slots: [0, 2, 4], group: 'yoon' },
  'Yoon (H)': { section: 'yoon', rowId: 'hya-row', slots: [0, 2, 4], group: 'yoon' },
  'Yoon (M)': { section: 'yoon', rowId: 'mya-row', slots: [0, 2, 4], group: 'yoon' },
  'Yoon (R)': { section: 'yoon', rowId: 'rya-row', slots: [0, 2, 4], group: 'yoon' },
  'Yoon (G)': { section: 'yoon', rowId: 'gya-row', slots: [0, 2, 4], group: 'yoon' },
  'Yoon (J)': { section: 'yoon', rowId: 'ja-row', slots: [0, 2, 4], group: 'yoon' },
  'Yoon (B)': { section: 'yoon', rowId: 'bya-row', slots: [0, 2, 4], group: 'yoon' },
  'Yoon (P)': { section: 'yoon', rowId: 'pya-row', slots: [0, 2, 4], group: 'yoon' },
};

const SECTION_META: Record<
  'gojuon' | 'dakuten' | 'yoon',
  { id: string; title: string; subtitle?: string }
> = {
  gojuon: { id: 'gojuon', title: 'Gojūon' },
  dakuten: {
    id: 'dakuten',
    title: 'Dakuten & Handakuten',
    subtitle: 'Suara berat (゛) dan ringan (゜)',
  },
  yoon: {
    id: 'yoon',
    title: 'Yōon',
    subtitle: 'Kombinasi konsonan + kecil ゃ・ゅ・ょ',
  },
};

/** Stable category order within each section (matches Excel / traditional chart). */
const CATEGORY_ORDER: string[] = Object.keys(CATEGORY_LAYOUT);

function buildVocab(script: KanaScript, entry: KanaManifestEntry): KanaVocab[] {
  if (!entry.vocabWord) return [];

  return [
    {
      word: entry.vocabWord,
      reading: entry.vocabReading,
      meaning: entry.vocabMeaning,
      imageSrc: kanaVocabImagePath(script, entry.romaji, 1),
      audioSrc: kanaVocabAudioPath(script, entry.romaji, 1),
    },
  ];
}

function buildCharacter(script: KanaScript, entry: KanaManifestEntry, layout: CategoryLayout): KanaCharacter {
  return {
    id: `${script}-${entry.romaji}`,
    script,
    char: entry.char,
    romaji: entry.romaji,
    group: layout.group,
    row: layout.rowId,
    audioSrc: kanaAudioPath(script, entry.romaji),
    strokeGifSrc: entry.strokeGifSrc,
    strokeSteps: [],
    vocabularies: buildVocab(script, entry),
  };
}

function entriesForScript(script: KanaScript): KanaManifestEntry[] {
  return KANA_MANIFEST.filter((e) => e.script === script);
}

function buildChartData(script: KanaScript): KanaChartData {
  const entries = entriesForScript(script);
  const byCategory = new Map<string, KanaManifestEntry[]>();

  for (const entry of entries) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }

  const characters: KanaCharacter[] = [];
  const sectionGrids: Record<'gojuon' | 'dakuten' | 'yoon', KanaGridCell[][]> = {
    gojuon: [],
    dakuten: [],
    yoon: [],
  };

  for (const category of CATEGORY_ORDER) {
    const layout = CATEGORY_LAYOUT[category];
    if (!layout) continue;

    const categoryEntries = byCategory.get(category);
    if (!categoryEntries || categoryEntries.length === 0) {
      console.warn(`[kana-data] missing category ${category} for ${script}`);
      continue;
    }

    if (categoryEntries.length !== layout.slots.length) {
      console.warn(
        `[kana-data] ${script} ${category}: expected ${layout.slots.length} chars, got ${categoryEntries.length}`,
      );
    }

    const row: KanaGridCell[] = [null, null, null, null, null];
    categoryEntries.forEach((entry, index) => {
      const slot = layout.slots[index];
      if (slot == null) return;
      const character = buildCharacter(script, entry, layout);
      row[slot] = character;
      characters.push(character);
    });

    sectionGrids[layout.section].push(row);
  }

  const sections: KanaChartSection[] = (['gojuon', 'dakuten', 'yoon'] as const).map((key) => {
    const meta = SECTION_META[key];
    return {
      id: meta.id,
      title: meta.title,
      subtitle: meta.subtitle,
      grid: sectionGrids[key],
    };
  });

  return {
    script,
    title: script === 'hiragana' ? 'Hiragana' : 'Katakana',
    sections,
    characters,
  };
}

const CHART_CACHE: Record<KanaScript, KanaChartData> = {
  hiragana: buildChartData('hiragana'),
  katakana: buildChartData('katakana'),
};

export function getKanaChartData(script: KanaScript): KanaChartData {
  return CHART_CACHE[script];
}

export function getKanaCharacterById(script: KanaScript, id: string): KanaCharacter | null {
  return getKanaChartData(script).characters.find((c) => c.id === id) ?? null;
}

export function getRowCharacters(script: KanaScript, row: string): KanaCharacter[] {
  return getKanaChartData(script).characters.filter((c) => c.row === row);
}

export { VOWEL_HEADERS };
