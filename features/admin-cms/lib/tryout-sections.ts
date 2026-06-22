/** JLPT tryout sections — ordered by exam structure. */
export const TRYOUT_SECTIONS = [
  {
    value: 'MOJI_GOI',
    label: 'Moji Goi',
    labelRomaji: 'MOJI GOI',
    color: 'bg-blue-500',
    description: 'Kosakata & kanji — bacaan, makna, penggunaan.',
  },
  {
    value: 'BUNPOU_DOKKAI',
    label: 'Bunpou Dokkai',
    labelRomaji: 'BUNPOU DOKKAI',
    color: 'bg-violet-500',
    description: 'Tata bahasa & pemahaman bacaan.',
  },
  {
    value: 'CHOKAI',
    label: 'Chokai',
    labelRomaji: 'CHOKAI',
    color: 'bg-emerald-500',
    description: 'Listening — unggah audio per soal atau grup soal.',
  },
] as const;

export type TryoutSectionValue = (typeof TRYOUT_SECTIONS)[number]['value'];

const SECTION_ORDER: Record<TryoutSectionValue, number> = {
  MOJI_GOI: 0,
  BUNPOU_DOKKAI: 1,
  CHOKAI: 2,
};

const SECTION_ALIASES: Record<string, TryoutSectionValue> = {
  moji_goi: 'MOJI_GOI',
  mojigoi: 'MOJI_GOI',
  'moji-goi': 'MOJI_GOI',
  'moji·goi': 'MOJI_GOI',
  'moji goi': 'MOJI_GOI',
  bunpou_dokkai: 'BUNPOU_DOKKAI',
  bunpoudokkai: 'BUNPOU_DOKKAI',
  'bunpou-dokkai': 'BUNPOU_DOKKAI',
  'bunpou·dokkai': 'BUNPOU_DOKKAI',
  'bunpou dokkai': 'BUNPOU_DOKKAI',
  chokai: 'CHOKAI',
  choukai: 'CHOKAI',
  'chou-kai': 'CHOKAI',
  listening: 'CHOKAI',
};

export function normalizeTryoutSection(raw: string): TryoutSectionValue | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase().replace(/[·\-\s]+/g, '_');
  if (upper === 'MOJI_GOI' || upper === 'BUNPOU_DOKKAI' || upper === 'CHOKAI') {
    return upper as TryoutSectionValue;
  }

  const key = trimmed.toLowerCase().replace(/[·\-\s]+/g, ' ').trim();
  return SECTION_ALIASES[key] ?? SECTION_ALIASES[key.replace(/ /g, '_')] ?? null;
}

export function compareTryoutSections(a: string, b: string): number {
  const orderA = SECTION_ORDER[a as TryoutSectionValue] ?? 99;
  const orderB = SECTION_ORDER[b as TryoutSectionValue] ?? 99;
  return orderA - orderB;
}

export function getTryoutSectionMeta(value: string) {
  return TRYOUT_SECTIONS.find((s) => s.value === value) ?? TRYOUT_SECTIONS[0];
}

/** @deprecated Legacy marker in questionText — prefer Question.audioUrl column. */
export function composeTryoutQuestionText(questionText: string, audioUrl?: string | null): string {
  const text = questionText.trim();
  const url = audioUrl?.trim();
  if (!url) return text;
  return `[AUDIO:${url}]\n\n${text}`;
}

export function extractAudioUrlFromQuestionText(text: string): { audioUrl: string | null; body: string } {
  const match = text.match(/^\[AUDIO:([^\]]+)\]\n\n([\s\S]*)$/);
  if (!match) return { audioUrl: null, body: text };
  return { audioUrl: match[1]!.trim(), body: match[2]!.trim() };
}

export function resolveTryoutQuestionDisplay(input: {
  questionText: string;
  audioUrl?: string | null;
  audioGroupId?: string | null;
}) {
  const legacy = extractAudioUrlFromQuestionText(input.questionText);
  return {
    body: legacy.body,
    audioUrl: input.audioUrl?.trim() || legacy.audioUrl,
    audioGroupId: input.audioGroupId?.trim() || null,
  };
}
