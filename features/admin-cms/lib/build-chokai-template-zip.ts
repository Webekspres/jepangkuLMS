import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { XLSX_COLORS } from '@/features/admin-cms/lib/xlsx-workbook';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** Nama folder contoh — harus sama dengan kolom Folder di chokai.xlsx */
export const CHOKAI_TEMPLATE_FOLDER_TEKS = '01-jawaban-teks';
export const CHOKAI_TEMPLATE_FOLDER_GAMBAR = '02-jawaban-gambar';

const COLUMNS = [
  { header: 'No', key: 'no', width: 6, required: true },
  { header: 'Folder', key: 'folder', width: 24, required: true },
  { header: 'Tipe Jawaban', key: 'tipe_jawaban', width: 14, required: true },
  { header: 'ID Audio', key: 'audio_id', width: 16 },
  { header: 'Mulai (menit:detik)', key: 'mulai', width: 16 },
  { header: 'Selesai (menit:detik)', key: 'selesai', width: 16 },
  { header: 'Grup Audio', key: 'audio_group', width: 14 },
  { header: 'Pertanyaan', key: 'pertanyaan', width: 36 },
  { header: 'A', key: 'a', width: 14 },
  { header: 'B', key: 'b', width: 14 },
  { header: 'C', key: 'c', width: 14 },
  { header: 'D', key: 'd', width: 14 },
  { header: 'Jawaban', key: 'jawaban', width: 10, required: true },
  { header: 'Penjelasan', key: 'penjelasan', width: 28 },
];

const EXCEL_GUIDE =
  'Satu baris = satu soal mendengar (Chokai). Kolom kuning wajib diisi. ' +
  'Kolom Folder harus sama persis dengan nama folder di dalam assets/. ' +
  'Tipe Jawaban «Teks»: isi Pertanyaan + pilihan A–D di Excel; simpan audio.mp3 di folder. ' +
  'Tipe Jawaban «Gambar»: siswa mendengar audio lalu memilih gambar; simpan audio.mp3 + a.png–d.png di folder; ' +
  'kolom A–D = label singkat tiap gambar (tampil jika gambar tidak bisa dimuat). ' +
  'Baris hijau = contoh, boleh dihapus sebelum impor.';

const ROOT_PANDUAN = `PANDUAN IMPOR SOAL CHOKAI (BAGIAN MENDENGAR)
==========================================

Template ini untuk mengunggah banyak soal listening sekaligus ke JepangKu LMS.

ISI PAKET ZIP
-------------
• chokai.xlsx     — daftar soal (buka dengan Microsoft Excel / LibreOffice)
• assets/         — satu subfolder per soal; berisi audio & gambar

CONTOH FOLDER (bisa dihapus atau jadikan acuan)
-----------------------------------------------
• assets/${CHOKAI_TEMPLATE_FOLDER_TEKS}/   — jawaban siswa berupa TEKS (A–D di Excel)
• assets/${CHOKAI_TEMPLATE_FOLDER_GAMBAR}/ — jawaban siswa berupa GAMBAR (a.png–d.png)

LANGKAH KERJA
-------------
1. Buka chokai.xlsx. Salin baris contoh untuk menambah soal.
2. Isi kolom Folder dengan nama folder baru (mis. 03-soal-saya).
3. Buat folder yang sama di dalam assets/ (mis. assets/03-soal-saya/).
4. Di setiap folder soal, wajib ada file audio.mp3 (rekaman suara).
5. Jika Tipe Jawaban = Gambar, tambahkan a.png, b.png, c.png, d.png di folder yang sama.
6. Kompres chokai.xlsx + folder assets/ menjadi satu file .zip
7. Di Admin JepangKu: Tryout → Kelola Soal → tab CHOKAI → unggah ZIP.

Butuh bantuan? Hubungi tim JepangKu.
`;

function folderReadmeTeks(folderName: string): string {
  return `CARA MENGISI FOLDER: ${folderName}
================================

Jenis soal: Jawaban berupa TEKS (pilihan A–D diisi di chokai.xlsx)

File yang WAJIB ada di folder ini:
  • audio.mp3 — rekaman suara untuk soal ini

File OPSIONAL:
  • stem.png — gambar ilustrasi di atas teks pertanyaan (boleh tidak dipakai)

Penting: nama folder ini harus sama dengan kolom «Folder» di chokai.xlsx.
`;
}

function folderReadmeGambar(folderName: string): string {
  return `CARA MENGISI FOLDER: ${folderName}
================================

Jenis soal: Jawaban berupa GAMBAR (siswa mendengar audio lalu memilih gambar)

File yang WAJIB ada di folder ini:
  • audio.mp3 — rekaman suara (pertanyaan didengar dari file ini)
  • a.png     — gambar pilihan A
  • b.png     — gambar pilihan B

File OPSIONAL (sesuai jumlah pilihan):
  • c.png — gambar pilihan C
  • d.png — gambar pilihan D

Di chokai.xlsx, isi kolom A–D dengan label singkat tiap gambar
(mis. nama tempat dalam bahasa Jepang). Label dipakai jika gambar tidak tampil.

Ganti gambar contoh (kotak kecil) dengan gambar asli Anda sebelum impor.

Penting: nama folder ini harus sama dengan kolom «Folder» di chokai.xlsx.
`;
}

async function buildChokaiXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Chokai', {
    properties: { tabColor: { argb: 'FF059669' } },
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  sheet.mergeCells(1, 1, 1, COLUMNS.length);
  const guide = sheet.getCell(1, 1);
  guide.value = EXCEL_GUIDE;
  guide.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };
  guide.alignment = { wrapText: true };

  const headerRow = sheet.getRow(2);
  COLUMNS.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
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

  const examples = [
    {
      no: 1,
      folder: CHOKAI_TEMPLATE_FOLDER_TEKS,
      tipe_jawaban: 'Teks',
      pertanyaan: '（　）に なにを いれますか。',
      a: 'を',
      b: 'が',
      c: 'に',
      d: 'で',
      jawaban: 'B',
      penjelasan: 'Contoh: setelah mendengar audio, siswa memilih jawaban teks.',
    },
    {
      no: 2,
      folder: CHOKAI_TEMPLATE_FOLDER_GAMBAR,
      tipe_jawaban: 'Gambar',
      a: '図書館',
      b: '駅',
      c: '公園',
      d: '病院',
      jawaban: 'B',
      penjelasan: 'Contoh: ganti audio.mp3 dan gambar a–d dengan file asli Anda.',
    },
  ];

  examples.forEach((row, i) => {
    const r = sheet.getRow(3 + i);
    COLUMNS.forEach((col, idx) => {
      const cell = r.getCell(idx + 1);
      cell.value = (row as Record<string, string | number>)[col.key] ?? '';
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: XLSX_COLORS.exampleRowBg },
      };
    });
  });

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function buildChokaiTemplateZipBuffer(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('PANDUAN-IMPOR-CHOKAI.txt', ROOT_PANDUAN);
  zip.file('chokai.xlsx', await buildChokaiXlsx());

  zip.file(
    `assets/${CHOKAI_TEMPLATE_FOLDER_TEKS}/BACA-FOLDER-INI.txt`,
    folderReadmeTeks(CHOKAI_TEMPLATE_FOLDER_TEKS),
  );
  zip.file(
    `assets/${CHOKAI_TEMPLATE_FOLDER_GAMBAR}/BACA-FOLDER-INI.txt`,
    folderReadmeGambar(CHOKAI_TEMPLATE_FOLDER_GAMBAR),
  );
  for (const letter of ['a', 'b', 'c', 'd']) {
    zip.file(`assets/${CHOKAI_TEMPLATE_FOLDER_GAMBAR}/${letter}.png`, TINY_PNG);
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
