import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { XLSX_COLORS } from '@/features/admin-cms/lib/xlsx-workbook';

const TINY_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
);

const COLUMNS = [
    { header: 'No', key: 'no', width: 6, required: true },
    { header: 'Folder', key: 'folder', width: 22, required: true },
    { header: 'Tipe Jawaban', key: 'tipe_jawaban', width: 14, required: true },
    { header: 'Audio ID', key: 'audio_id', width: 16 },
    { header: 'Mulai', key: 'mulai', width: 10 },
    { header: 'Selesai', key: 'selesai', width: 10 },
    { header: 'Audio Group', key: 'audio_group', width: 14 },
    { header: 'Pertanyaan', key: 'pertanyaan', width: 36 },
    { header: 'A', key: 'a', width: 14 },
    { header: 'B', key: 'b', width: 14 },
    { header: 'C', key: 'c', width: 14 },
    { header: 'D', key: 'd', width: 14 },
    { header: 'Jawaban', key: 'jawaban', width: 10, required: true },
    { header: 'Penjelasan', key: 'penjelasan', width: 28 },
];

async function buildChokaiXlsx(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Chokai', {
        properties: { tabColor: { argb: 'FF059669' } },
        views: [{ state: 'frozen', ySplit: 2 }],
    });

    sheet.mergeCells(1, 1, 1, COLUMNS.length);
    const guide = sheet.getCell(1, 1);
    guide.value =
        'Tipe Jawaban: Teks atau Gambar. Gambar: isi A–D sebagai teks alternatif; file a.png–d.png di folder. Wajib: audio.mp3 per folder. Server membutuhkan ffmpeg.';
    guide.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };
    guide.alignment = { wrapText: true };

    const headerRow = sheet.getRow(2);
    COLUMNS.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: col.required ? XLSX_COLORS.requiredHeaderText : 'FF334155' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: col.required ? XLSX_COLORS.requiredHeaderBg : XLSX_COLORS.optionalHeaderBg },
        };
        sheet.getColumn(idx + 1).width = col.width;
    });

    const examples = [
        {
            no: 1,
            folder: '01-contoh-teks',
            tipe_jawaban: 'Teks',
            pertanyaan: '（　）に なにを いれますか。',
            a: 'を',
            b: 'が',
            c: 'に',
            d: 'で',
            jawaban: 'B',
            penjelasan: 'Contoh soal teks.',
        },
        {
            no: 2,
            folder: '02-contoh-gambar',
            tipe_jawaban: 'Gambar',
            a: '図書館',
            b: '駅',
            c: '公園',
            d: '病院',
            jawaban: 'B',
            penjelasan: 'Contoh soal gambar — ganti placeholder PNG & audio.mp3.',
        },
    ];

    examples.forEach((row, i) => {
        const r = sheet.getRow(3 + i);
        COLUMNS.forEach((col, idx) => {
            const cell = r.getCell(idx + 1);
            cell.value = (row as Record<string, string | number>)[col.key] ?? '';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.exampleRowBg } };
        });
    });

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
}

export async function buildChokaiTemplateZipBuffer(): Promise<Buffer> {
    const zip = new JSZip();
    zip.file(
        'PETUNJUK.txt',
        [
            'JepangKu LMS — Template Impor Chokai',
            '',
            '1. Isi chokai.xlsx (kolom Tipe Jawaban: Teks atau Gambar).',
            '2. Setiap baris butuh folder di assets/{Folder}/ dengan audio.mp3.',
            '3. Tipe Gambar: a.png, b.png, c.png, d.png + teks A–D sebagai alternatif.',
            '4. Tipe Teks: isi kolom Pertanyaan & A–D; opsional stem.png.',
            '5. Zip seluruh isi (chokai.xlsx + folder assets/) lalu unggah di admin tab CHOKAI.',
            '6. Server production wajib punya ffmpeg & ffprobe di PATH.',
        ].join('\n'),
    );

    zip.file('chokai.xlsx', await buildChokaiXlsx());

    zip.file(
        'assets/01-contoh-teks/LIHAT.txt',
        'Letakkan audio.mp3 di folder ini. Opsional: stem.png',
    );
    zip.file(
        'assets/02-contoh-gambar/LIHAT.txt',
        'Letakkan audio.mp3 dan a.png–d.png (ganti placeholder).',
    );
    for (const letter of ['a', 'b', 'c', 'd']) {
        zip.file(`assets/02-contoh-gambar/${letter}.png`, TINY_PNG);
    }

    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
