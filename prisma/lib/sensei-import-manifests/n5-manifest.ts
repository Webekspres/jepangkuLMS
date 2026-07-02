import type { SenseiImportManifest } from './types';

export const N5_SENSEI_MANIFEST: SenseiImportManifest = {
    level: 'N5',
    course: {
        slug: 'jlpt-n5-kursus-lengkap',
        title: 'JLPT N5 — Kursus Lengkap',
        description:
            'Kurikulum N5 berbasis workbook sensei: kanji, kosakata, tata bahasa, kuis, dan try out.',
        level: 'N5',
    },
    sheets: {
        kanji: 'N5 - 漢字 (Kanji)',
        kosakata: 'N5 - 語彙 (Kosakata)',
        tataBahasa: 'N5 - 文法 (Tata Bahasa)',
        quiz1: 'N5 - Quiz 1',
        quiz2: 'N5 - Quiz 2',
        placement: 'N5 - Placement Test',
        tryout: 'N5 - Try Out 1',
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
            strokeGif: 'GIF Cara Menulis Kanji',
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
