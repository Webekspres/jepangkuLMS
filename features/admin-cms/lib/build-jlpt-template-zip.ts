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
    { header: 'Options', key: 'options', width: 32, required: true },
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

const INFO_SESI_COLUMNS = [
    { header: 'Judul Sesi', key: 'judul_sesi', width: 30, required: true },
    { header: 'Kode Sesi', key: 'kode_sesi', width: 20, required: true },
    { header: 'Nama Fase', key: 'nama_fase', width: 20, required: true },
    { header: 'Tingkat JLPT', key: 'tingkat_jlpt', width: 15, required: true },
    { header: 'Durasi Menit', key: 'durasi_menit', width: 15, required: true },
    { header: 'Urutan Tampil', key: 'urutan_tampil', width: 15 },
    { header: 'Aktif (Ya/Tidak)', key: 'aktif', width: 15 },
    { header: 'Deskripsi', key: 'deskripsi', width: 40 },
];

async function buildJlptExcel(): Promise<Buffer> {
    const finalWb = new ExcelJS.Workbook();

    // 0. Info Sesi Sheet
    const infoSheet = finalWb.addWorksheet('1. Info Sesi', {
        properties: { tabColor: { argb: 'FF3B82F6' } },
        views: [{ state: 'frozen', ySplit: 2 }],
    });
    infoSheet.mergeCells(1, 1, 1, INFO_SESI_COLUMNS.length);
    const guide0 = infoSheet.getRow(1);
    guide0.values = ['Isi detail sesi tryout jika Anda mengimpor ini sebagai sesi baru. Jika diimpor ke sesi yang sudah ada, tab ini akan diabaikan.'];
    guide0.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };

    const header0 = infoSheet.getRow(2);
    INFO_SESI_COLUMNS.forEach((col, idx) => {
        const cell = header0.getCell(idx + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: col.required ? XLSX_COLORS.requiredHeaderText : 'FF334155' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col.required ? XLSX_COLORS.requiredHeaderBg : XLSX_COLORS.optionalHeaderBg } };
        infoSheet.getColumn(idx + 1).width = col.width;
    });

    const example0 = infoSheet.getRow(3);
    example0.values = ['Simulasi N4', 'simulasi-n4-01', 'Fase 1', 'N4', 120, 1, 'Ya', 'Simulasi persiapan JLPT N4 lengkap.'];
    INFO_SESI_COLUMNS.forEach((_, idx) => {
        example0.getCell(idx + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.exampleRowBg } };
    });

    // ponytail: extract repetitive sheet creation logic
    function createJlptSheet(
        wb: ExcelJS.Workbook,
        name: string,
        tabColor: string,
        guideText: string,
        columns: { header: string; key: string; width: number; required?: boolean }[],
        exampleValues: Array<string | number | null>,
        hasSecondExample: boolean = false,
        secondExampleValues?: Array<string | number | null>,
    ) {
        const sheet = wb.addWorksheet(name, {
            properties: { tabColor: { argb: tabColor } },
            views: [{ state: 'frozen', ySplit: 2 }],
        });
        sheet.mergeCells(1, 1, 1, columns.length);
        const guideRow = sheet.getRow(1);
        guideRow.values = [guideText];
        guideRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };

        const headerRow = sheet.getRow(2);
        columns.forEach((col, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = col.header;
            cell.font = { bold: true, color: { argb: col.required ? XLSX_COLORS.requiredHeaderText : 'FF334155' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col.required ? XLSX_COLORS.requiredHeaderBg : XLSX_COLORS.optionalHeaderBg } };
            sheet.getColumn(idx + 1).width = col.width;
        });

        const exampleRow = sheet.getRow(3);
        exampleRow.values = exampleValues;
        columns.forEach((_, idx) => {
            exampleRow.getCell(idx + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.exampleRowBg } };
        });

        if (hasSecondExample && secondExampleValues) {
            const exampleRow2 = sheet.getRow(4);
            exampleRow2.values = secondExampleValues;
            columns.forEach((_, idx) => {
                exampleRow2.getCell(idx + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.exampleRowBg } };
            });
        }
    }

    // 1. MOJI_GOI Sheet
    createJlptSheet(
        finalWb,
        'MOJI_GOI',
        'FF7C3AED',
        'Soal kosakata & kanji — bacaan, makna, penggunaan. Text-only, tidak perlu media.',
        MOJI_COLUMNS,
        [1, '猫は毎日ねる。', '飼う', '飼える', '飼われる', '飼わせる', 'A', '正しい使い方の例です。']
    );

    // 2. BUNPOU_DOKKAI Sheet
    createJlptSheet(
        finalWb,
        'BUNPOU_DOKKAI',
        'FF06B6D4',
        'Soal tata bahasa & pemahaman bacaan. Opsi diisi di kolom Options, pisahkan baris dengan Enter.',
        BUNPOU_COLUMNS,
        [1, '私は毎日何時に起きますか。', 'A. 7時に\nB. 7時を\nC. 7時で\nD. 7時から', 'A', '時間を表すときは「に」を使います。']
    );

    // 3. CHOKAI Sheet
    createJlptSheet(
        finalWb,
        'CHOKAI',
        'FF059669',
        'Soal mendengarkan — diperlukan audio di assets/[folder]/audio.mp3. Tipe Jawaban "Gambar" memerlukan file a.png–d.png.',
        CHOKAI_COLUMNS,
        [1, TEMPLATE_CHOKAI_FOLDER_TEXT, 'Teks', 'audio_01', null, null, null, '（　）に なにを いれますか。', 'を', 'が', 'に', 'で', 'B', 'Contoh: jawaban teks dari pilihan di Excel.'],
        true,
        [2, TEMPLATE_CHOKAI_FOLDER_IMAGE, 'Gambar', 'audio_02', null, null, null, null, '図書館', '駅', '公園', '病院', 'C', 'Contoh: jawaban gambar (a–d.png). Ganti file real sebelum impor.']
    );

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