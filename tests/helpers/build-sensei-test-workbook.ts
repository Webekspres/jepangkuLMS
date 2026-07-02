import ExcelJS from 'exceljs';
import { N4_KOSAKATA_CATEGORIES, N4_TATA_BAHASA_CATEGORIES } from '@/prisma/lib/n4-curriculum';
import { N5_KOSAKATA_CATEGORIES, N5_TATA_BAHASA_CATEGORIES } from '@/prisma/lib/n5-curriculum';
import { N4_SENSEI_MANIFEST } from '@/prisma/lib/sensei-import-manifests/n4-manifest';
import { N5_SENSEI_MANIFEST } from '@/prisma/lib/sensei-import-manifests/n5-manifest';
import type { SenseiImportManifest } from '@/prisma/lib/sensei-import-manifests/types';

type SenseiTestWorkbookOptions = {
    level: 'N4' | 'N5';
    kanjiCategory?: string;
    unknownKanjiCategory?: string;
    includeStrokeGif?: boolean;
    quizRichText?: boolean;
};

function addSheet(
    workbook: ExcelJS.Workbook,
    name: string,
    headers: string[],
    rows: Array<Array<string | number>>,
) {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(headers);
    for (const row of rows) sheet.addRow(row);
}

function manifestFor(level: 'N4' | 'N5'): SenseiImportManifest {
    return level === 'N4' ? N4_SENSEI_MANIFEST : N5_SENSEI_MANIFEST;
}

export async function buildSenseiTestWorkbookBuffer(options: SenseiTestWorkbookOptions): Promise<Buffer> {
    const manifest = manifestFor(options.level);
    const workbook = new ExcelJS.Workbook();
    const kanjiCategory = options.kanjiCategory ?? (options.level === 'N4' ? 'Alam & Musim' : 'Angka');
    const kosakataCategory = options.level === 'N4' ? N4_KOSAKATA_CATEGORIES[0] : N5_KOSAKATA_CATEGORIES[0];
    const tataBahasaCategory = options.level === 'N4' ? N4_TATA_BAHASA_CATEGORIES[0] : N5_TATA_BAHASA_CATEGORIES[0];

    const kanjiHeaders = [
        manifest.columns.kanji.no,
        manifest.columns.kanji.category,
        manifest.columns.kanji.huruf,
        manifest.columns.kanji.furigana,
        manifest.columns.kanji.romaji,
        manifest.columns.kanji.arti,
    ];
    if (manifest.columns.kanji.mnemonik) kanjiHeaders.push(manifest.columns.kanji.mnemonik);
    if (options.includeStrokeGif && manifest.columns.kanji.strokeGif) {
        kanjiHeaders.push(manifest.columns.kanji.strokeGif);
    }

    const kanjiRows: Array<Array<string | number>> = [];
    const baseKanjiRow: Array<string | number> = [1, kanjiCategory, '一', 'ひと', 'hito', 'satu'];
    if (manifest.columns.kanji.mnemonik) baseKanjiRow.push('Satu garis');
    if (options.includeStrokeGif && manifest.columns.kanji.strokeGif) {
        baseKanjiRow.push('https://example.com/kanji.gif');
    }
    kanjiRows.push(baseKanjiRow);

    if (options.unknownKanjiCategory) {
        kanjiRows.push([2, options.unknownKanjiCategory, '試', 'し', 'shi', 'uji']);
    }

    addSheet(workbook, manifest.sheets.kanji, kanjiHeaders, kanjiRows);
    addSheet(workbook, manifest.sheets.kosakata, [
        manifest.columns.kosakata.no,
        manifest.columns.kosakata.category,
        manifest.columns.kosakata.kosakata,
        manifest.columns.kosakata.furigana,
        manifest.columns.kosakata.romaji,
        manifest.columns.kosakata.arti,
    ], [[1, kosakataCategory, 'ご飯', 'ごはん', 'gohan', 'nasi']]);
    addSheet(workbook, manifest.sheets.tataBahasa, [
        manifest.columns.tataBahasa.no,
        manifest.columns.tataBahasa.category,
        manifest.columns.tataBahasa.tataBahasa,
        manifest.columns.tataBahasa.arti,
    ], [[1, tataBahasaCategory, 'です', 'adalah']]);
    addSheet(workbook, manifest.sheets.quiz1, [
        manifest.columns.quiz.no,
        manifest.columns.quiz.pertanyaan,
        manifest.columns.quiz.pilihanJawaban,
        manifest.columns.quiz.jawabanBenar,
        manifest.columns.quiz.penjelasan,
    ], [
        [
            1,
            options.quizRichText ? 'Pertanyaan **tebal**' : 'Apa arti 一?',
            '1. satu\n2. dua',
            '1',
            'Benar',
        ],
    ]);
    addSheet(workbook, manifest.sheets.quiz2, [
        manifest.columns.quiz.no,
        manifest.columns.quiz.pertanyaan,
        manifest.columns.quiz.pilihanJawaban,
        manifest.columns.quiz.jawabanBenar,
    ], [[1, 'Soal 2?', '1. ya\n2. tidak', '2']]);
    if (manifest.sheets.placement) {
        addSheet(workbook, manifest.sheets.placement, [
            manifest.columns.quiz.no,
            manifest.columns.quiz.pertanyaan,
            manifest.columns.quiz.pilihanJawaban,
            manifest.columns.quiz.jawabanBenar,
        ], [[1, 'Placement?', '1. A\n2. B', '1']]);
    }
    addSheet(workbook, manifest.sheets.tryout, [
        manifest.columns.quiz.no,
        manifest.columns.quiz.pertanyaan,
        manifest.columns.quiz.pilihanJawaban,
        manifest.columns.quiz.jawabanBenar,
    ], [[1, 'Tryout?', '1. benar\n2. salah', '1']]);

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}
