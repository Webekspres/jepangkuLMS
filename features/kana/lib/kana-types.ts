export type KanaScript = 'hiragana' | 'katakana';

export type KanaGroup = 'gojuon' | 'dakuten' | 'handakuten' | 'yoon';

export type KanaVocab = {
  word: string;
  reading: string;
  meaning: string;
  imageSrc: string;
  audioSrc: string;
};

export type KanaCharacter = {
  id: string;
  script: KanaScript;
  char: string;
  romaji: string;
  group: KanaGroup;
  row: string;
  audioSrc: string;
  strokeGifSrc: string;
  strokeSteps: string[];
  vocabularies: KanaVocab[];
};

export type KanaGridCell = KanaCharacter | null;

export type KanaChartSection = {
  id: string;
  title: string;
  subtitle?: string;
  grid: KanaGridCell[][];
};

export type KanaChartData = {
  script: KanaScript;
  title: string;
  sections: KanaChartSection[];
  characters: KanaCharacter[];
};
