import type { FlashcardItem } from '@/features/learning/components/flashcard-deck';

const KIND_STYLE = {
    'Kosa Kata': { accentColor: '#2563eb', trackColorClass: 'bg-blue-600' },
    Kanji: { accentColor: '#d97706', trackColorClass: 'bg-amber-600' },
    'Tata Bahasa': { accentColor: '#7c3aed', trackColorClass: 'bg-violet-600' },
} as const;

type LessonMaterials = {
    kosakatas: Array<{
        kosakata: string;
        furigana: string | null;
        romaji: string | null;
        arti: string;
        contohKalimat: string | null;
    }>;
    kanjis: Array<{
        huruf: string;
        furigana: string | null;
        romaji: string | null;
        arti: string;
        mnemonik?: string | null;
        strokeGifUrl?: string | null;
    }>;
    tataBahasas: Array<{
        tataBahasa: string;
        arti: string;
        contohKalimat: string | null;
    }>;
};

/** Gabung semua materi pelajaran jadi satu deck flashcard. */
export function buildLessonFlashcards(materials: LessonMaterials): FlashcardItem[] {
    const cards: FlashcardItem[] = [];

    for (const item of materials.kosakatas) {
        const style = KIND_STYLE['Kosa Kata'];
        cards.push({
            front: item.kosakata,
            sub: [item.furigana, item.romaji].filter(Boolean).join(' · ') || null,
            back: item.arti,
            example: item.contohKalimat,
            badge: 'Kosa Kata',
            accentColor: style.accentColor,
            trackColorClass: style.trackColorClass,
        });
    }

    for (const item of materials.kanjis) {
        const style = KIND_STYLE.Kanji;
        const details = [item.mnemonik, item.strokeGifUrl ? `GIF: ${item.strokeGifUrl}` : null]
            .filter(Boolean)
            .join('\n');
        cards.push({
            front: item.huruf,
            sub: [item.furigana, item.romaji].filter(Boolean).join(' · ') || null,
            back: item.arti,
            example: details || null,
            badge: 'Kanji',
            accentColor: style.accentColor,
            trackColorClass: style.trackColorClass,
        });
    }

    for (const item of materials.tataBahasas) {
        const style = KIND_STYLE['Tata Bahasa'];
        cards.push({
            front: item.tataBahasa,
            sub: null,
            back: item.arti,
            example: item.contohKalimat,
            badge: 'Tata Bahasa',
            accentColor: style.accentColor,
            trackColorClass: style.trackColorClass,
        });
    }

    return cards;
}
