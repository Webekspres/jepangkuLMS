import type { SenseiImportManifest } from './types';

export const N4_SENSEI_MANIFEST: SenseiImportManifest = {
    level: 'N4',
    course: {
        slug: 'jlpt-n4-kursus-lengkap',
        title: 'JLPT N4 — Kursus Lengkap',
        description:
            'Kurikulum N4 berbasis workbook sensei: kanji, kosakata, tata bahasa, kuis, dan try out.',
        level: 'N4',
    },
    sheets: {
        kanji: 'N4 - 漢字 (Kanji)',
        kosakata: 'N4 - 語彙 (Kosakata)',
        tataBahasa: 'N4 - 文法 (Tata Bahasa)',
        quiz1: 'N4 - Quiz 1',
        quiz2: 'N4 - Quiz 2',
        tryout: 'N4 - Try Out 1',
    },
    columns: {
        kanji: {
            no: 'No',
            category: 'Kategori',
            huruf: 'Huruf',
            furigana: 'Furigana',
            romaji: 'Romaji',
            arti: 'Arti',
            contohKunyomi: 'Contoh Kata Kunyomi',
            romajiKunyomi: 'Romaji Kunyomi',
            artiKunyomi: 'Arti Kunyomi',
            contohOnyomi: 'Contoh Kata Onyomi',
            romajiOnyomi: 'Romaji Onyomi',
            artiOnyomi: 'Arti Onyomi',
            mnemonik: 'Cara Menghafal Kanji (Mnemonik)',
        },
        kosakata: {
            no: 'No',
            category: 'Kategori',
            kosakata: 'Kosakata',
            furigana: 'Furigana',
            romaji: 'Romaji',
            arti: 'Arti',
            contohKalimat: 'Contoh Kalimat',
        },
        tataBahasa: {
            no: 'No',
            category: 'Kategori',
            tataBahasa: 'Tata Bahasa',
            arti: 'Arti',
            contohKalimat: 'Contoh Kalimat',
        },
        quiz: {
            no: 'No',
            pertanyaan: 'Pertanyaan',
            pilihanJawaban: 'Pilihan Jawaban',
            jawabanBenar: 'Jawaban Benar',
            penjelasan: 'Penjelasan',
        },
    },
};
