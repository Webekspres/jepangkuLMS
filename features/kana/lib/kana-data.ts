import {
  kanaAudioPath,
  kanaStrokeGifPath,
  kanaStrokeStepPath,
  kanaVocabAudioPath,
  kanaVocabImagePath,
} from './kana-asset-paths';
import type {
  KanaCharacter,
  KanaChartData,
  KanaChartSection,
  KanaGridCell,
  KanaGroup,
  KanaScript,
  KanaVocab,
} from './kana-types';

type CellDef = { char: string; romaji: string } | null;

type RowDef = {
  row: string;
  cells: CellDef[];
};

const VOWEL_HEADERS = ['a', 'i', 'u', 'e', 'o'] as const;

const HIRAGANA_GOJUON_ROWS: RowDef[] = [
  {
    row: 'a-row',
    cells: [
      { char: 'あ', romaji: 'a' },
      { char: 'い', romaji: 'i' },
      { char: 'う', romaji: 'u' },
      { char: 'え', romaji: 'e' },
      { char: 'お', romaji: 'o' },
    ],
  },
  {
    row: 'ka-row',
    cells: [
      { char: 'か', romaji: 'ka' },
      { char: 'き', romaji: 'ki' },
      { char: 'く', romaji: 'ku' },
      { char: 'け', romaji: 'ke' },
      { char: 'こ', romaji: 'ko' },
    ],
  },
  {
    row: 'sa-row',
    cells: [
      { char: 'さ', romaji: 'sa' },
      { char: 'し', romaji: 'shi' },
      { char: 'す', romaji: 'su' },
      { char: 'せ', romaji: 'se' },
      { char: 'そ', romaji: 'so' },
    ],
  },
  {
    row: 'ta-row',
    cells: [
      { char: 'た', romaji: 'ta' },
      { char: 'ち', romaji: 'chi' },
      { char: 'つ', romaji: 'tsu' },
      { char: 'て', romaji: 'te' },
      { char: 'と', romaji: 'to' },
    ],
  },
  {
    row: 'na-row',
    cells: [
      { char: 'な', romaji: 'na' },
      { char: 'に', romaji: 'ni' },
      { char: 'ぬ', romaji: 'nu' },
      { char: 'ね', romaji: 'ne' },
      { char: 'の', romaji: 'no' },
    ],
  },
  {
    row: 'ha-row',
    cells: [
      { char: 'は', romaji: 'ha' },
      { char: 'ひ', romaji: 'hi' },
      { char: 'ふ', romaji: 'fu' },
      { char: 'へ', romaji: 'he' },
      { char: 'ほ', romaji: 'ho' },
    ],
  },
  {
    row: 'ma-row',
    cells: [
      { char: 'ま', romaji: 'ma' },
      { char: 'み', romaji: 'mi' },
      { char: 'む', romaji: 'mu' },
      { char: 'め', romaji: 'me' },
      { char: 'も', romaji: 'mo' },
    ],
  },
  {
    row: 'ya-row',
    cells: [
      { char: 'や', romaji: 'ya' },
      null,
      { char: 'ゆ', romaji: 'yu' },
      null,
      { char: 'よ', romaji: 'yo' },
    ],
  },
  {
    row: 'ra-row',
    cells: [
      { char: 'ら', romaji: 'ra' },
      { char: 'り', romaji: 'ri' },
      { char: 'る', romaji: 'ru' },
      { char: 'れ', romaji: 're' },
      { char: 'ろ', romaji: 'ro' },
    ],
  },
  {
    row: 'wa-row',
    cells: [
      { char: 'わ', romaji: 'wa' },
      null,
      null,
      null,
      { char: 'を', romaji: 'wo' },
    ],
  },
  {
    row: 'n-row',
    cells: [{ char: 'ん', romaji: 'n' }, null, null, null, null],
  },
];

const KATAKANA_GOJUON_ROWS: RowDef[] = [
  {
    row: 'a-row',
    cells: [
      { char: 'ア', romaji: 'a' },
      { char: 'イ', romaji: 'i' },
      { char: 'ウ', romaji: 'u' },
      { char: 'エ', romaji: 'e' },
      { char: 'オ', romaji: 'o' },
    ],
  },
  {
    row: 'ka-row',
    cells: [
      { char: 'カ', romaji: 'ka' },
      { char: 'キ', romaji: 'ki' },
      { char: 'ク', romaji: 'ku' },
      { char: 'ケ', romaji: 'ke' },
      { char: 'コ', romaji: 'ko' },
    ],
  },
  {
    row: 'sa-row',
    cells: [
      { char: 'サ', romaji: 'sa' },
      { char: 'シ', romaji: 'shi' },
      { char: 'ス', romaji: 'su' },
      { char: 'セ', romaji: 'se' },
      { char: 'ソ', romaji: 'so' },
    ],
  },
  {
    row: 'ta-row',
    cells: [
      { char: 'タ', romaji: 'ta' },
      { char: 'チ', romaji: 'chi' },
      { char: 'ツ', romaji: 'tsu' },
      { char: 'テ', romaji: 'te' },
      { char: 'ト', romaji: 'to' },
    ],
  },
  {
    row: 'na-row',
    cells: [
      { char: 'ナ', romaji: 'na' },
      { char: 'ニ', romaji: 'ni' },
      { char: 'ヌ', romaji: 'nu' },
      { char: 'ネ', romaji: 'ne' },
      { char: 'ノ', romaji: 'no' },
    ],
  },
  {
    row: 'ha-row',
    cells: [
      { char: 'ハ', romaji: 'ha' },
      { char: 'ヒ', romaji: 'hi' },
      { char: 'フ', romaji: 'fu' },
      { char: 'ヘ', romaji: 'he' },
      { char: 'ホ', romaji: 'ho' },
    ],
  },
  {
    row: 'ma-row',
    cells: [
      { char: 'マ', romaji: 'ma' },
      { char: 'ミ', romaji: 'mi' },
      { char: 'ム', romaji: 'mu' },
      { char: 'メ', romaji: 'me' },
      { char: 'モ', romaji: 'mo' },
    ],
  },
  {
    row: 'ya-row',
    cells: [
      { char: 'ヤ', romaji: 'ya' },
      null,
      { char: 'ユ', romaji: 'yu' },
      null,
      { char: 'ヨ', romaji: 'yo' },
    ],
  },
  {
    row: 'ra-row',
    cells: [
      { char: 'ラ', romaji: 'ra' },
      { char: 'リ', romaji: 'ri' },
      { char: 'ル', romaji: 'ru' },
      { char: 'レ', romaji: 're' },
      { char: 'ロ', romaji: 'ro' },
    ],
  },
  {
    row: 'wa-row',
    cells: [
      { char: 'ワ', romaji: 'wa' },
      null,
      null,
      null,
      { char: 'ヲ', romaji: 'wo' },
    ],
  },
  {
    row: 'n-row',
    cells: [{ char: 'ン', romaji: 'n' }, null, null, null, null],
  },
];

const HIRAGANA_DAKUTEN_ROWS: RowDef[] = [
  {
    row: 'ga-row',
    cells: [
      { char: 'が', romaji: 'ga' },
      { char: 'ぎ', romaji: 'gi' },
      { char: 'ぐ', romaji: 'gu' },
      { char: 'げ', romaji: 'ge' },
      { char: 'ご', romaji: 'go' },
    ],
  },
  {
    row: 'za-row',
    cells: [
      { char: 'ざ', romaji: 'za' },
      { char: 'じ', romaji: 'ji' },
      { char: 'ず', romaji: 'zu' },
      { char: 'ぜ', romaji: 'ze' },
      { char: 'ぞ', romaji: 'zo' },
    ],
  },
  {
    row: 'da-row',
    cells: [
      { char: 'だ', romaji: 'da' },
      { char: 'ぢ', romaji: 'ji2' },
      { char: 'づ', romaji: 'zu2' },
      { char: 'で', romaji: 'de' },
      { char: 'ど', romaji: 'do' },
    ],
  },
  {
    row: 'ba-row',
    cells: [
      { char: 'ば', romaji: 'ba' },
      { char: 'び', romaji: 'bi' },
      { char: 'ぶ', romaji: 'bu' },
      { char: 'べ', romaji: 'be' },
      { char: 'ぼ', romaji: 'bo' },
    ],
  },
  {
    row: 'pa-row',
    cells: [
      { char: 'ぱ', romaji: 'pa' },
      { char: 'ぴ', romaji: 'pi' },
      { char: 'ぷ', romaji: 'pu' },
      { char: 'ぺ', romaji: 'pe' },
      { char: 'ぽ', romaji: 'po' },
    ],
  },
];

const KATAKANA_DAKUTEN_ROWS: RowDef[] = [
  {
    row: 'ga-row',
    cells: [
      { char: 'ガ', romaji: 'ga' },
      { char: 'ギ', romaji: 'gi' },
      { char: 'グ', romaji: 'gu' },
      { char: 'ゲ', romaji: 'ge' },
      { char: 'ゴ', romaji: 'go' },
    ],
  },
  {
    row: 'za-row',
    cells: [
      { char: 'ザ', romaji: 'za' },
      { char: 'ジ', romaji: 'ji' },
      { char: 'ズ', romaji: 'zu' },
      { char: 'ゼ', romaji: 'ze' },
      { char: 'ゾ', romaji: 'zo' },
    ],
  },
  {
    row: 'da-row',
    cells: [
      { char: 'ダ', romaji: 'da' },
      { char: 'ヂ', romaji: 'ji2' },
      { char: 'ヅ', romaji: 'zu2' },
      { char: 'デ', romaji: 'de' },
      { char: 'ド', romaji: 'do' },
    ],
  },
  {
    row: 'ba-row',
    cells: [
      { char: 'バ', romaji: 'ba' },
      { char: 'ビ', romaji: 'bi' },
      { char: 'ブ', romaji: 'bu' },
      { char: 'ベ', romaji: 'be' },
      { char: 'ボ', romaji: 'bo' },
    ],
  },
  {
    row: 'pa-row',
    cells: [
      { char: 'パ', romaji: 'pa' },
      { char: 'ピ', romaji: 'pi' },
      { char: 'プ', romaji: 'pu' },
      { char: 'ペ', romaji: 'pe' },
      { char: 'ポ', romaji: 'po' },
    ],
  },
];

const HIRAGANA_YOON_ROWS: RowDef[] = [
  {
    row: 'kya-row',
    cells: [
      { char: 'きゃ', romaji: 'kya' },
      { char: 'きぃ', romaji: 'kyi' },
      { char: 'きゅ', romaji: 'kyu' },
      { char: 'きぇ', romaji: 'kye' },
      { char: 'きょ', romaji: 'kyo' },
    ],
  },
  {
    row: 'sha-row',
    cells: [
      { char: 'しゃ', romaji: 'sha' },
      { char: 'しぃ', romaji: 'syi' },
      { char: 'しゅ', romaji: 'shu' },
      { char: 'しぇ', romaji: 'she' },
      { char: 'しょ', romaji: 'sho' },
    ],
  },
  {
    row: 'cha-row',
    cells: [
      { char: 'ちゃ', romaji: 'cha' },
      { char: 'ちぃ', romaji: 'cyi' },
      { char: 'ちゅ', romaji: 'chu' },
      { char: 'ちぇ', romaji: 'che' },
      { char: 'ちょ', romaji: 'cho' },
    ],
  },
  {
    row: 'nya-row',
    cells: [
      { char: 'にゃ', romaji: 'nya' },
      { char: 'にぃ', romaji: 'nyi' },
      { char: 'にゅ', romaji: 'nyu' },
      { char: 'にぇ', romaji: 'nye' },
      { char: 'にょ', romaji: 'nyo' },
    ],
  },
  {
    row: 'hya-row',
    cells: [
      { char: 'ひゃ', romaji: 'hya' },
      { char: 'ひぃ', romaji: 'hyi' },
      { char: 'ひゅ', romaji: 'hyu' },
      { char: 'ひぇ', romaji: 'hye' },
      { char: 'ひょ', romaji: 'hyo' },
    ],
  },
  {
    row: 'mya-row',
    cells: [
      { char: 'みゃ', romaji: 'mya' },
      { char: 'みぃ', romaji: 'myi' },
      { char: 'みゅ', romaji: 'myu' },
      { char: 'みぇ', romaji: 'mye' },
      { char: 'みょ', romaji: 'myo' },
    ],
  },
  {
    row: 'rya-row',
    cells: [
      { char: 'りゃ', romaji: 'rya' },
      { char: 'りぃ', romaji: 'ryi' },
      { char: 'りゅ', romaji: 'ryu' },
      { char: 'りぇ', romaji: 'rye' },
      { char: 'りょ', romaji: 'ryo' },
    ],
  },
  {
    row: 'gya-row',
    cells: [
      { char: 'ぎゃ', romaji: 'gya' },
      { char: 'ぎぃ', romaji: 'gyi' },
      { char: 'ぎゅ', romaji: 'gyu' },
      { char: 'ぎぇ', romaji: 'gye' },
      { char: 'ぎょ', romaji: 'gyo' },
    ],
  },
];

const KATAKANA_YOON_ROWS: RowDef[] = [
  {
    row: 'kya-row',
    cells: [
      { char: 'キャ', romaji: 'kya' },
      { char: 'キィ', romaji: 'kyi' },
      { char: 'キュ', romaji: 'kyu' },
      { char: 'キェ', romaji: 'kye' },
      { char: 'キョ', romaji: 'kyo' },
    ],
  },
  {
    row: 'sha-row',
    cells: [
      { char: 'シャ', romaji: 'sha' },
      { char: 'シィ', romaji: 'syi' },
      { char: 'シュ', romaji: 'shu' },
      { char: 'シェ', romaji: 'she' },
      { char: 'ショ', romaji: 'sho' },
    ],
  },
  {
    row: 'cha-row',
    cells: [
      { char: 'チャ', romaji: 'cha' },
      { char: 'チィ', romaji: 'cyi' },
      { char: 'チュ', romaji: 'chu' },
      { char: 'チェ', romaji: 'che' },
      { char: 'チョ', romaji: 'cho' },
    ],
  },
  {
    row: 'nya-row',
    cells: [
      { char: 'ニャ', romaji: 'nya' },
      { char: 'ニィ', romaji: 'nyi' },
      { char: 'ニュ', romaji: 'nyu' },
      { char: 'ニェ', romaji: 'nye' },
      { char: 'ニョ', romaji: 'nyo' },
    ],
  },
  {
    row: 'hya-row',
    cells: [
      { char: 'ヒャ', romaji: 'hya' },
      { char: 'ヒィ', romaji: 'hyi' },
      { char: 'ヒュ', romaji: 'hyu' },
      { char: 'ヒェ', romaji: 'hye' },
      { char: 'ヒョ', romaji: 'hyo' },
    ],
  },
  {
    row: 'mya-row',
    cells: [
      { char: 'ミャ', romaji: 'mya' },
      { char: 'ミィ', romaji: 'myi' },
      { char: 'ミュ', romaji: 'myu' },
      { char: 'ミェ', romaji: 'mye' },
      { char: 'ミョ', romaji: 'myo' },
    ],
  },
  {
    row: 'rya-row',
    cells: [
      { char: 'リャ', romaji: 'rya' },
      { char: 'リィ', romaji: 'ryi' },
      { char: 'リュ', romaji: 'ryu' },
      { char: 'リェ', romaji: 'rye' },
      { char: 'リョ', romaji: 'ryo' },
    ],
  },
  {
    row: 'gya-row',
    cells: [
      { char: 'ギャ', romaji: 'gya' },
      { char: 'ギィ', romaji: 'gyi' },
      { char: 'ギュ', romaji: 'gyu' },
      { char: 'ギェ', romaji: 'gye' },
      { char: 'ギョ', romaji: 'gyo' },
    ],
  },
];

/** Pilot vocab for first vowel row — assets optional. */
const PILOT_VOCAB: Partial<
  Record<KanaScript, Partial<Record<string, Omit<KanaVocab, 'imageSrc' | 'audioSrc'> & { vocabIndex: number }>>>
> = {
  hiragana: {
    a: { word: 'あめ', reading: 'ame', meaning: 'Hujan', vocabIndex: 1 },
    i: { word: 'いぬ', reading: 'inu', meaning: 'Anjing', vocabIndex: 1 },
    u: { word: 'うみ', reading: 'umi', meaning: 'Laut', vocabIndex: 1 },
    e: { word: 'えき', reading: 'eki', meaning: 'Stasiun', vocabIndex: 1 },
    o: { word: 'おに', reading: 'oni', meaning: 'Hantu / oni', vocabIndex: 1 },
  },
  katakana: {
    a: { word: 'アイス', reading: 'aisu', meaning: 'Es krim', vocabIndex: 1 },
    i: { word: 'イギリス', reading: 'igirisu', meaning: 'Inggris / U.K.', vocabIndex: 1 },
    u: { word: 'ウール', reading: 'uuru', meaning: 'Wol', vocabIndex: 1 },
    e: { word: 'エレベーター', reading: 'erebeetaa', meaning: 'Lift', vocabIndex: 1 },
    o: { word: 'オレンジ', reading: 'orenji', meaning: 'Jeruk', vocabIndex: 1 },
  },
};

function resolveGroup(row: RowDef, sectionGroup: KanaGroup): KanaGroup {
  if (sectionGroup === 'yoon') return 'yoon';
  if (row.row === 'pa-row') return 'handakuten';
  if (sectionGroup === 'dakuten') return 'dakuten';
  return 'gojuon';
}

function buildVocabularies(script: KanaScript, romaji: string): KanaVocab[] {
  const pilot = PILOT_VOCAB[script]?.[romaji];
  if (!pilot) return [];

  const idx = pilot.vocabIndex;
  return [
    {
      word: pilot.word,
      reading: pilot.reading,
      meaning: pilot.meaning,
      imageSrc: kanaVocabImagePath(script, romaji, idx),
      audioSrc: kanaVocabAudioPath(script, romaji, idx),
    },
  ];
}

function buildCharacter(
  script: KanaScript,
  row: RowDef,
  cell: { char: string; romaji: string },
  sectionGroup: KanaGroup,
): KanaCharacter {
  const group = resolveGroup(row, sectionGroup);
  const strokeSteps = [1, 2, 3].map((step) => kanaStrokeStepPath(script, cell.romaji, step));

  return {
    id: `${script}-${cell.romaji}`,
    script,
    char: cell.char,
    romaji: cell.romaji,
    group,
    row: row.row,
    audioSrc: kanaAudioPath(script, cell.romaji),
    strokeGifSrc: kanaStrokeGifPath(script, cell.romaji),
    strokeSteps,
    vocabularies: buildVocabularies(script, cell.romaji),
  };
}

function rowsToGrid(
  script: KanaScript,
  rows: RowDef[],
  sectionGroup: KanaGroup,
): { grid: KanaGridCell[][]; characters: KanaCharacter[] } {
  const characters: KanaCharacter[] = [];
  const grid = rows.map((row) =>
    row.cells.map((cell) => {
      if (!cell) return null;
      const character = buildCharacter(script, row, cell, sectionGroup);
      characters.push(character);
      return character;
    }),
  );

  return { grid, characters };
}

function buildSection(
  id: string,
  title: string,
  script: KanaScript,
  rows: RowDef[],
  group: KanaGroup,
  subtitle?: string,
): { section: KanaChartSection; characters: KanaCharacter[] } {
  const { grid, characters } = rowsToGrid(script, rows, group);
  return {
    section: { id, title, subtitle, grid },
    characters,
  };
}

function buildChartData(script: KanaScript): KanaChartData {
  const gojuonRows = script === 'hiragana' ? HIRAGANA_GOJUON_ROWS : KATAKANA_GOJUON_ROWS;
  const dakutenRows = script === 'hiragana' ? HIRAGANA_DAKUTEN_ROWS : KATAKANA_DAKUTEN_ROWS;
  const yoonRows = script === 'hiragana' ? HIRAGANA_YOON_ROWS : KATAKANA_YOON_ROWS;

  const gojuon = buildSection('gojuon', 'Gojūon', script, gojuonRows, 'gojuon');
  const dakuten = buildSection(
    'dakuten',
    'Dakuten & Handakuten',
    script,
    dakutenRows,
    'dakuten',
    'Suara berat (゛) dan ringan (゜)',
  );
  const yoon = buildSection(
    'yoon',
    'Yōon',
    script,
    yoonRows,
    'yoon',
    'Kombinasi konsonan + kecil ゃ・ゅ・ょ',
  );

  return {
    script,
    title: script === 'hiragana' ? 'Hiragana' : 'Katakana',
    sections: [gojuon.section, dakuten.section, yoon.section],
    characters: [...gojuon.characters, ...dakuten.characters, ...yoon.characters],
  };
}

export function getKanaChartData(script: KanaScript): KanaChartData {
  return buildChartData(script);
}

export function getKanaCharacterById(script: KanaScript, id: string): KanaCharacter | null {
  return getKanaChartData(script).characters.find((c) => c.id === id) ?? null;
}

export function getRowCharacters(script: KanaScript, row: string): KanaCharacter[] {
  return getKanaChartData(script).characters.filter((c) => c.row === row);
}

export { VOWEL_HEADERS };
