import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { XLSX_COLORS } from '@/features/admin-cms/lib/xlsx-workbook';

const TINY_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
);

const TEMPLATE_CHOKAI_FOLDER_TEXT = '01-jawaban-teks';
const TEMPLATE_CHOKAI_FOLDER_IMAGE = '02-jawaban-gambar';

const ROOT_GUIDE = `PANDUAN IMPOR SOAL JLPT (Unified ZIP Format)
=========================================

ISI PAKET ZIP
-------------
• jlpt.xlsx      — daftar soal dengan 3 tab (lihat di bawah)
• assets/        — folder untuk media CHOKAI saja (optional)

TAB-TAB DI JLPT.XLSX
--------------------
1. MOJI_GOI      — Soal kosakata & kanji (text-only, tidak perlu media)
2. BUNPOU_DOKKAI — Soal tata bahasa & pemahaman bacaan (text-only)
3. CHOKAI        — Soal mendengarkan (perlu audio + assets/)

UNTUK MOJI_GOI & BUNPOU_DOKKAI
------------------------------
• Isi kolom Pertanyaan, Pilihan A–D, Jawaban Benar, Penjelasan
• Tidak perlu media/file tambahan
• Impor langsung tanpa folder assets/

UNTUK CHOKAI (Mendengarkan)
---------------------------
• Wajib ada file assets/ dengan struktur folder:
  assets/[nama-soal]/
    ├── audio.mp3          (wajib)
    ├── a.png, b.png, c.png, d.png  (untuk jawaban gambar)
    └── stem.png           (optional, gambar ilustrasi pertanyaan)
• Kolom Tipe Jawaban: pilih "Teks" atau "Gambar"
• Jika Teks: isi kolom Pertanyaan & A–D di Excel
• Jika Gambar: buat file a–d.png, label di Excel adalah deskripsi singkat

LANGKAH KERJA
-------------
1. Buka jlpt.xlsx. Lihat contoh di setiap tab.
2. Tambah baris baru untuk soal Anda (salin baris contoh).
3. Untuk CHOKAI: buat folder assets/[nama-soal], masukkan audio.mp3.
4. Kompres jlpt.xlsx + assets/ menjadi satu file .zip.
5. Di Admin JepangKu: Kelola Soal → Impor → unggah ZIP.

File format untuk ZIP:
jlpt-import.zip
├── jlpt.xlsx
└── assets/
    ├── soal-001/
    │   └── audio.mp3
    ├── soal-002/
    │   ├── audio.mp3
    │   ├── a.png
    │   ├── b.png
    │   ├── c.png
    │   └── d.png

Butuh bantuan? Hubungi tim JepangKu.
`;

const MOJI_COLUMNS = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Pertanyaan', key: 'pertanyaan', width: 30, required: true },
    { header: 'Pilihan A', key: 'pilihan_a', width: 16, required: true },
    { header: 'Pilihan B', key: 'pilihan_b', width: 16, required: true },
    { header: 'Pilihan C', key: 'pilihan_c', width: 16 },
    { header: 'Pilihan D', key: 'pilihan_d', width: 16 },
    { header: 'Jawaban Benar', key: 'jawaban_benar', width: 14, required: true },
    { header: 'Penjelasan', key: 'penjelasan', width: 28 },

];

const BUNPOU_COLUMNS = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Pertanyaan', key: 'pertanyaan', width: 30, required: true },
    { header: 'Options (newline-separated)', key: 'options', width: 32, required: true },
    { header: 'Jawaban Benar', key: 'jawaban_benar', width: 14, required: true },
    { header: 'Penjelasan', key: 'penjelasan', width: 28 },

];

const CHOKAI_COLUMNS = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Folder', key: 'folder', width: 24, required: true },
    { header: 'Tipe Jawaban', key: 'tipe_jawaban', width: 14, required: true },
    { header: 'ID Audio', key: 'audio_id', width: 16 },
    { header: 'Mulai (mm:ss)', key: 'mulai', width: 14 },
    { header: 'Selesai (mm:ss)', key: 'selesai', width: 14 },
    { header: 'Grup Audio', key: 'audio_group', width: 14 },
    { header: 'Pertanyaan', key: 'pertanyaan', width: 28 },
    { header: 'A', key: 'a', width: 14 },
    { header: 'B', key: 'b', width: 14 },
    { header: 'C', key: 'c', width: 14 },
    { header: 'D', key: 'd', width: 14 },
    { header: 'Jawaban', key: 'jawaban', width: 10, required: true },
    { header: 'Penjelasan', key: 'penjelasan', width: 28 },
];

async function buildMojiSheet(): Promise<ExcelJS.Worksheet> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('MOJI_GOI', {
        properties: { tabColor: { argb: 'FF7C3AED' } },
        views: [{ state: 'frozen', ySplit: 2 }],
    });

    const guide = sheet.getRow(1);
    guide.values = ['Soal kosakata & kanji — bacaan, makna, penggunaan. Text-only, tidak perlu media.'];
    guide.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };
    guide.getCell(1).alignment = { wrapText: true };

    const header = sheet.getRow(2);
    MOJI_COLUMNS.forEach((col, idx) => {
        const cell = header.getCell(idx + 1);
        cell.value = col.header;
        cell.font = {
            bold: true,
            color: { argb: col.required ? XLSX_COLORS.requiredHeaderText : 'FF334155' },
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: col.required ? XLSX_COLORS.requiredHeaderBg : XLSX_COLORS.optionalHeaderBg },
        };
        sheet.getColumn(idx + 1).width = col.width;
    });

    const example = sheet.getRow(3);
    example.values = [
        1,
        '猫は毎日ねる。',
        '飼う',
        '飼える',
        '飼われる',
        '飼わせる',
        'A',
        '正しい使い方の例です。',
        null,
    ];
    MOJI_COLUMNS.forEach((_, idx) => {
        example.getCell(idx + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: XLSX_COLORS.exampleRowBg },
        };
    });

    return sheet;
}

async function buildBunpouSheet(): Promise<ExcelJS.Worksheet> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('BUNPOU_DOKKAI', {
        properties: { tabColor: { argb: 'FF06B6D4' } },
        views: [{ state: 'frozen', ySplit: 2 }],
    });

    const guide = sheet.getRow(1);
    guide.values = ['Soal tata bahasa & pemahaman bacaan. Opsi diisi di kolom Options (pisahkan dengan newline atau A. B. C. D. format).'];
    guide.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };
    guide.getCell(1).alignment = { wrapText: true };

    const header = sheet.getRow(2);
    BUNPOU_COLUMNS.forEach((col, idx) => {
        const cell = header.getCell(idx + 1);
        cell.value = col.header;
        cell.font = {
            bold: true,
            color: { argb: col.required ? XLSX_COLORS.requiredHeaderText : 'FF334155' },
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: col.required ? XLSX_COLORS.requiredHeaderBg : XLSX_COLORS.optionalHeaderBg },
        };
        sheet.getColumn(idx + 1).width = col.width;
    });

    const example = sheet.getRow(3);
    example.values = [
        1,
        '私は毎日何時に起きますか。',
        'A. 7時に\nB. 7時を\nC. 7時で\nD. 7時から',
        'A',
        '時間を表すときは「に」を使います。',
        null,
    ];
    BUNPOU_COLUMNS.forEach((_, idx) => {
        example.getCell(idx + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: XLSX_COLORS.exampleRowBg },
        };
    });

    return sheet;
}

async function buildChokaiSheet(): Promise<ExcelJS.Worksheet> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('CHOKAI', {
        properties: { tabColor: { argb: 'FF059669' } },
        views: [{ state: 'frozen', ySplit: 2 }],
    });

    const guide = sheet.getRow(1);
    guide.values = ['Soal mendengarkan — diperlukan audio di assets/[folder]/audio.mp3. Tipe Jawaban "Gambar" memerlukan file a.png–d.png.'];
    guide.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };
    guide.getCell(1).alignment = { wrapText: true };

    const header = sheet.getRow(2);
    CHOKAI_COLUMNS.forEach((col, idx) => {
        const cell = header.getCell(idx + 1);
        cell.value = col.header;
        cell.font = {
            bold: true,
            color: { argb: col.required ? XLSX_COLORS.requiredHeaderText : 'FF334155' },
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: col.required ? XLSX_COLORS.requiredHeaderBg : XLSX_COLORS.optionalHeaderBg },
        };
        sheet.getColumn(idx + 1).width = col.width;
    });

    const exampleTeks = sheet.getRow(3);
    exampleTeks.values = [
        1,
        TEMPLATE_CHOKAI_FOLDER_TEXT,
        'Teks',
        'audio_01',
        null,
        null,
        null,
        '（　）に なにを いれますか。',
        'を',
        'が',
        'に',
        'で',
        'B',
        'Contoh: jawaban teks dari pilihan di Excel.',
    ];
    CHOKAI_COLUMNS.forEach((_, idx) => {
        exampleTeks.getCell(idx + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: XLSX_COLORS.exampleRowBg },
        };
    });

    const exampleGambar = sheet.getRow(4);
    exampleGambar.values = [
        2,
        TEMPLATE_CHOKAI_FOLDER_IMAGE,
        'Gambar',
        'audio_02',
        null,
        null,
        null,
        null,
        '図書館',
        '駅',
        '公園',
        '病院',
        'C',
        'Contoh: jawaban gambar (a–d.png). Ganti file real sebelum impor.',
    ];
    CHOKAI_COLUMNS.forEach((_, idx) => {
        exampleGambar.getCell(idx + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: XLSX_COLORS.exampleRowBg },
        };
    });

    return sheet;
}

async function buildJlptExcel(): Promise<Buffer> {
    // const workbook = new ExcelJS.Workbook(); // unused, removed

    // Add sheets
    const mojiWb = new ExcelJS.Workbook();
    const mojiSheet = mojiWb.addWorksheet('MOJI_GOI', {
        properties: { tabColor: { argb: 'FF7C3AED' } },
        views: [{ state: 'frozen', ySplit: 2 }],
    });

    const guide1 = mojiSheet.getRow(1);
    guide1.values = ['Soal kosakata & kanji — bacaan, makna, penggunaan. Text-only, tidak perlu media.'];
    guide1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };
    guide1.getCell(1).alignment = { wrapText: true };

    const header1 = mojiSheet.getRow(2);
    MOJI_COLUMNS.forEach((col, idx) => {
        const cell = header1.getCell(idx + 1);
        cell.value = col.header;
        cell.font = {
            bold: true,
            color: { argb: col.required ? XLSX_COLORS.requiredHeaderText : 'FF334155' },
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: col.required ? XLSX_COLORS.requiredHeaderBg : XLSX_COLORS.optionalHeaderBg },
        };
        mojiSheet.getColumn(idx + 1).width = col.width;
    });

    const example1 = mojiSheet.getRow(3);
    example1.values = [1, '猫は毎日ねる。', '飼う', '飼える', '飼われる', '飼わせる', 'A', '正しい使い方の例です。'];
    MOJI_COLUMNS.forEach((_, idx) => {
        example1.getCell(idx + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: XLSX_COLORS.exampleRowBg },
        };
    });

    const bunpouWb = new ExcelJS.Workbook();
    const bunpouSheet = bunpouWb.addWorksheet('BUNPOU_DOKKAI', {
        properties: { tabColor: { argb: 'FF06B6D4' } },
        views: [{ state: 'frozen', ySplit: 2 }],
    });

    const guide2 = bunpouSheet.getRow(1);
    guide2.values = ['Soal tata bahasa & pemahaman bacaan. Opsi diisi di kolom Options (pisahkan dengan newline atau A. B. C. D. format).'];
    guide2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };
    guide2.getCell(1).alignment = { wrapText: true };

    const header2 = bunpouSheet.getRow(2);
    BUNPOU_COLUMNS.forEach((col, idx) => {
        const cell = header2.getCell(idx + 1);
        cell.value = col.header;
        cell.font = {
            bold: true,
            color: { argb: col.required ? XLSX_COLORS.requiredHeaderText : 'FF334155' },
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: col.required ? XLSX_COLORS.requiredHeaderBg : XLSX_COLORS.optionalHeaderBg },
        };
        bunpouSheet.getColumn(idx + 1).width = col.width;
    });

    const example2 = bunpouSheet.getRow(3);
    example2.values = [1, '私は毎日何時に起きますか。', 'A. 7時に\nB. 7時を\nC. 7時で\nD. 7時から', 'A', '時間を表すときは「に」を使います。', null];
    BUNPOU_COLUMNS.forEach((_, idx) => {
        example2.getCell(idx + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: XLSX_COLORS.exampleRowBg },
        };
    });

    const chokaiWb = new ExcelJS.Workbook();
    const chokaiSheet = chokaiWb.addWorksheet('CHOKAI', {
        properties: { tabColor: { argb: 'FF059669' } },
        views: [{ state: 'frozen', ySplit: 2 }],
    });

    const guide3 = chokaiSheet.getRow(1);
    guide3.values = ['Soal mendengarkan — diperlukan audio di assets/[folder]/audio.mp3. Tipe Jawaban "Gambar" memerlukan file a.png–d.png.'];
    guide3.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };
    guide3.getCell(1).alignment = { wrapText: true };

    const header3 = chokaiSheet.getRow(2);
    CHOKAI_COLUMNS.forEach((col, idx) => {
        const cell = header3.getCell(idx + 1);
        cell.value = col.header;
        cell.font = {
            bold: true,
            color: { argb: col.required ? XLSX_COLORS.requiredHeaderText : 'FF334155' },
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: col.required ? XLSX_COLORS.requiredHeaderBg : XLSX_COLORS.optionalHeaderBg },
        };
        chokaiSheet.getColumn(idx + 1).width = col.width;
    });

    const example3a = chokaiSheet.getRow(3);
    example3a.values = [1, TEMPLATE_CHOKAI_FOLDER_TEXT, 'Teks', 'audio_01', null, null, null, '（　）に なにを いれますか。', 'を', 'が', 'に', 'で', 'B', 'Contoh: jawaban teks dari pilihan di Excel.'];
    CHOKAI_COLUMNS.forEach((_, idx) => {
        example3a.getCell(idx + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: XLSX_COLORS.exampleRowBg },
        };
    });

    const example3b = chokaiSheet.getRow(4);
    example3b.values = [2, TEMPLATE_CHOKAI_FOLDER_IMAGE, 'Gambar', 'audio_02', null, null, null, null, '図書館', '駅', '公園', '病院', 'C', 'Contoh: jawaban gambar (a–d.png). Ganti file real sebelum impor.'];
    CHOKAI_COLUMNS.forEach((_, idx) => {
        example3b.getCell(idx + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: XLSX_COLORS.exampleRowBg },
        };
    });

    // Create final workbook with all sheets
    const finalWb = new ExcelJS.Workbook();
    const fMoji = finalWb.addWorksheet('MOJI_GOI', { properties: mojiSheet.properties });
    mojiSheet.eachRow((row) => {
        fMoji.getRow(row.number).values = row.values;
        row.eachCell((cell) => {
            fMoji.getCell(cell.address).font = cell.font;
            fMoji.getCell(cell.address).fill = cell.fill;
            fMoji.getCell(cell.address).alignment = cell.alignment;
        });
    });
    mojiSheet.columns.forEach((col, idx) => {
        fMoji.getColumn(idx + 1).width = col.width;
    });

    // Add other sheets to final workbook
    const fBunpou = finalWb.addWorksheet('BUNPOU_DOKKAI', { properties: bunpouSheet.properties });
    bunpouSheet.eachRow((row) => {
        fBunpou.getRow(row.number).values = row.values;
        row.eachCell((cell) => {
            fBunpou.getCell(cell.address).font = cell.font;
            fBunpou.getCell(cell.address).fill = cell.fill;
            fBunpou.getCell(cell.address).alignment = cell.alignment;
        });
    });
    bunpouSheet.columns.forEach((col, idx) => {
        fBunpou.getColumn(idx + 1).width = col.width;
    });

    const fChokai = finalWb.addWorksheet('CHOKAI', { properties: chokaiSheet.properties });
    chokaiSheet.eachRow((row) => {
        fChokai.getRow(row.number).values = row.values;
        row.eachCell((cell) => {
            fChokai.getCell(cell.address).font = cell.font;
            fChokai.getCell(cell.address).fill = cell.fill;
            fChokai.getCell(cell.address).alignment = cell.alignment;
        });
    });
    chokaiSheet.columns.forEach((col, idx) => {
        fChokai.getColumn(idx + 1).width = col.width;
    });

    const buf = await finalWb.xlsx.writeBuffer();
    return Buffer.from(buf);
}

export async function buildJlptTemplateZipBuffer(): Promise<Buffer> {
    const zip = new JSZip();

    // Add guide
    zip.file('PANDUAN-IMPOR-JLPT.txt', ROOT_GUIDE);

    // Add multi-sheet Excel
    zip.file('jlpt.xlsx', await buildJlptExcel());

    // Add example assets for CHOKAI
    zip.file(`assets/${TEMPLATE_CHOKAI_FOLDER_TEXT}/README.txt`, `Contoh folder untuk soal Chokai dengan jawaban TEKS.
Ganti dengan folder & audio.mp3 Anda sendiri.`);

    zip.file(
        `assets/${TEMPLATE_CHOKAI_FOLDER_IMAGE}/README.txt`,
        `Contoh folder untuk soal Chokai dengan jawaban GAMBAR.
Wajib ada: audio.mp3, a.png, b.png, c.png, d.png
Ganti dengan file asli Anda.`,
    );

    // Add tiny placeholder images
    for (const letter of ['a', 'b', 'c', 'd']) {
        zip.file(`assets/${TEMPLATE_CHOKAI_FOLDER_IMAGE}/${letter}.png`, TINY_PNG);
    }

    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
