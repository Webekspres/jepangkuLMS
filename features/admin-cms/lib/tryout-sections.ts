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
        description: 'Listening — impor ZIP (audio clip + opsi gambar) atau unggah manual.',
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
    'kosakata & kanji': 'MOJI_GOI',
    'kosakata dan kanji': 'MOJI_GOI',
    kosakata: 'MOJI_GOI',
    kanji: 'MOJI_GOI',
    bunpou_dokkai: 'BUNPOU_DOKKAI',
    bunpoudokkai: 'BUNPOU_DOKKAI',
    'bunpou-dokkai': 'BUNPOU_DOKKAI',
    'bunpou·dokkai': 'BUNPOU_DOKKAI',
    'bunpou dokkai': 'BUNPOU_DOKKAI',
    'tata bahasa & bacaan': 'BUNPOU_DOKKAI',
    'tata bahasa dan bacaan': 'BUNPOU_DOKKAI',
    'tata bahasa': 'BUNPOU_DOKKAI',
    bacaan: 'BUNPOU_DOKKAI',
    dokkai: 'BUNPOU_DOKKAI',
    chokai: 'CHOKAI',
    choukai: 'CHOKAI',
    'chou-kai': 'CHOKAI',
    listening: 'CHOKAI',
    mendengar: 'CHOKAI',
    'soal mendengar': 'CHOKAI',
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

/** JLPT exam section order — MOJI GOI → BUNPOU DOKKAI → CHOKAI. */
export const TRYOUT_SECTION_ORDER = TRYOUT_SECTIONS.map((s) => s.value);

export function sortTryoutExamQuestions<
  T extends { section: string; sortOrder: number; mondaiOrder?: number },
>(questions: T[]): T[] {
  return [...questions].sort((a, b) => {
    const sectionCmp = compareTryoutSections(a.section, b.section);
    if (sectionCmp !== 0) return sectionCmp;
    const mondaiCmp = (a.mondaiOrder ?? 1) - (b.mondaiOrder ?? 1);
    if (mondaiCmp !== 0) return mondaiCmp;
    return a.sortOrder - b.sortOrder;
  });
}

export function assignTryoutExamNumbers<T>(questions: T[]): (T & { examNumber: number })[] {
    return questions.map((question, index) => ({
        ...question,
        examNumber: index + 1,
    }));
}

export function isTryoutSectionAccessible(
    section: string,
    questions: { id: string; section: string }[],
    answers: Record<string, string>,
): boolean {
    const sectionIndex = TRYOUT_SECTION_ORDER.indexOf(section as TryoutSectionValue);
    if (sectionIndex <= 0) return true;

    for (let i = 0; i < sectionIndex; i++) {
        const priorSection = TRYOUT_SECTION_ORDER[i]!;
        const priorQuestions = questions.filter((q) => q.section === priorSection);
        const allAnswered = priorQuestions.every((q) => Boolean(answers[q.id]));
        if (!allAnswered) return false;
    }

    return true;
}

export function getTryoutSectionProgress(
    section: string,
    questions: { id: string; section: string }[],
    answers: Record<string, string>,
): { answered: number; total: number } {
    const sectionQuestions = questions.filter((q) => q.section === section);
    return {
        total: sectionQuestions.length,
        answered: sectionQuestions.filter((q) => answers[q.id]).length,
    };
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
