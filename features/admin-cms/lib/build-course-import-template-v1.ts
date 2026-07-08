import ExcelJS from 'exceljs';
import {
  OFFICIAL_COURSE_V1_METADATA_SHEET,
  OFFICIAL_COURSE_V1_TEMPLATE_KEY,
  OFFICIAL_COURSE_V1_TEMPLATE_VERSION,
} from '@/features/admin-cms/lib/import-framework/official-course-v1-metadata';
import { addDataSheet, addGuideSheet } from '@/features/admin-cms/lib/xlsx-template-builder';

const JLPT_LEVEL_OPTIONS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const YES_NO_OPTIONS = ['Ya', 'Tidak'] as const;
const LESSON_TYPE_OPTIONS = ['VIDEO', 'FLASHCARD', 'QUIZ', 'TEXT'] as const;
const FLASHCARD_TRACK_OPTIONS = ['KANJI', 'KOSAKATA', 'TATA_BAHASA'] as const;

function addMetadataSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet(OFFICIAL_COURSE_V1_METADATA_SHEET, {
    state: 'veryHidden',
  });

  sheet.getCell('A1').value = 'key';
  sheet.getCell('B1').value = 'value';
  sheet.getCell('A2').value = 'templateKey';
  sheet.getCell('B2').value = OFFICIAL_COURSE_V1_TEMPLATE_KEY;
  sheet.getCell('A3').value = 'templateVersion';
  sheet.getCell('B3').value = OFFICIAL_COURSE_V1_TEMPLATE_VERSION;
  sheet.getCell('A4').value = 'authoredFor';
  sheet.getCell('B4').value = 'JepangKu LMS';
}

export async function buildCourseImportTemplateV1Buffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JepangKu LMS';

  addMetadataSheet(workbook);

  addGuideSheet(workbook, [
    '1) Isi tab Course (satu baris), Module, dan Lesson untuk struktur kursus.',
    '2) Tambahkan konten di tab Video, Text, Flashcard, atau Quiz sesuai tipe pelajaran.',
    '3) ID eksternal (course/module/lesson) harus unik dan konsisten antar tab.',
    '4) Slug URL dibuat otomatis dari judul saat impor — tidak perlu diisi di template.',
    '5) Kolom pilihan (Ya/Tidak, tipe pelajaran, level, dll.) memakai dropdown — pilih dari daftar.',
    '6) Tab Flashcard (track KANJI): isi GIF Cara Menulis Kanji dengan URL animasi goresan kanji.',
    '7) Workbook legacy sensei N4/N5 tetap didukung — template ini untuk kursus baru.',
    '8) Unggah file di halaman Impor Kursus setelah pratinjau valid.',
  ]);

  addDataSheet(
    workbook,
    '1. Course',
    'FF0F766E',
    'Satu baris = satu kursus. ID eksternal dipakai untuk sinkronisasi ulang.',
    [
      { header: 'ID Eksternal Kursus', key: 'course_external_id', width: 24, required: true },
      { header: 'Judul', key: 'judul', width: 32, required: true },
      { header: 'Deskripsi', key: 'deskripsi', width: 36 },
      { header: 'Level', key: 'level', width: 12, listOptions: [...JLPT_LEVEL_OPTIONS] },
      { header: 'Publikasi', key: 'publikasi', width: 14, listOptions: [...YES_NO_OPTIONS] },
    ],
    {
      course_external_id: 'kursus-contoh-n5',
      judul: 'Kursus Contoh JLPT N5',
      deskripsi: 'Contoh kursus dari template resmi v1',
      level: 'N5',
      publikasi: 'Tidak',
    },
  );

  addDataSheet(
    workbook,
    '2. Module',
    'FF059669',
    'Satu baris = satu modul. ID eksternal kursus harus cocok dengan tab Course.',
    [
      { header: 'ID Eksternal Modul', key: 'module_external_id', width: 24, required: true },
      { header: 'ID Eksternal Kursus', key: 'course_external_id', width: 24, required: true },
      { header: 'Judul', key: 'judul', width: 32, required: true },
      { header: 'Urutan', key: 'urutan', width: 10, required: true },
      { header: 'Deskripsi', key: 'deskripsi', width: 32 },
    ],
    {
      module_external_id: 'modul-1',
      course_external_id: 'kursus-contoh-n5',
      judul: 'Modul 1 — Dasar',
      urutan: 1,
      deskripsi: 'Pengenalan materi dasar',
    },
  );

  addDataSheet(
    workbook,
    '3. Lesson',
    'FF0284C7',
    'Pilih tipe pelajaran dari dropdown. Slug URL dibuat otomatis dari judul.',
    [
      { header: 'ID Eksternal Pelajaran', key: 'lesson_external_id', width: 26, required: true },
      { header: 'ID Eksternal Modul', key: 'module_external_id', width: 24, required: true },
      { header: 'Judul', key: 'judul', width: 32, required: true },
      { header: 'Urutan', key: 'urutan', width: 10, required: true },
      {
        header: 'Tipe Pelajaran',
        key: 'tipe_pelajaran',
        width: 16,
        required: true,
        listOptions: [...LESSON_TYPE_OPTIONS],
      },
    ],
    {
      lesson_external_id: 'pelajaran-kanji-1',
      module_external_id: 'modul-1',
      judul: 'Kanji Dasar',
      urutan: 1,
      tipe_pelajaran: 'FLASHCARD',
    },
  );

  addDataSheet(
    workbook,
    '4. Video',
    'FF7C3AED',
    'Satu baris per pelajaran VIDEO. ID eksternal pelajaran harus ada di tab Lesson.',
    [
      { header: 'ID Eksternal Pelajaran', key: 'lesson_external_id', width: 26, required: true },
      { header: 'URL Video', key: 'video_url', width: 40, required: true },
      { header: 'Teks Konten', key: 'teks_konten', width: 36 },
    ],
    {
      lesson_external_id: 'pelajaran-video-1',
      video_url: 'https://www.youtube.com/watch?v=example',
      teks_konten: 'Catatan pengajar opsional',
    },
  );

  addDataSheet(
    workbook,
    '5. Text',
    'FF6366F1',
    'Satu baris per pelajaran TEXT.',
    [
      { header: 'ID Eksternal Pelajaran', key: 'lesson_external_id', width: 26, required: true },
      { header: 'Teks Konten', key: 'teks_konten', width: 60, required: true },
    ],
    {
      lesson_external_id: 'pelajaran-teks-1',
      teks_konten: 'Materi bacaan atau penjelasan tertulis.',
    },
  );

  addDataSheet(
    workbook,
    '6. Flashcard',
    'FFF59E0B',
    'Pilih track dari dropdown. Kolom kanji (onyomi/kunyomi/GIF) hanya untuk track KANJI — kosongkan jika track lain.',
    [
      { header: 'ID Eksternal Pelajaran', key: 'lesson_external_id', width: 26, required: true },
      {
        header: 'Track',
        key: 'track',
        width: 14,
        required: true,
        listOptions: [...FLASHCARD_TRACK_OPTIONS],
      },
      { header: 'Kategori', key: 'kategori', width: 18 },
      { header: 'Huruf / Kosakata / Tata Bahasa', key: 'huruf', width: 22 },
      { header: 'Furigana', key: 'furigana', width: 16 },
      { header: 'Romaji', key: 'romaji', width: 14 },
      { header: 'Arti', key: 'arti', width: 20 },
      { header: 'Romaji Onyomi', key: 'romaji_onyomi', width: 14 },
      { header: 'Romaji Kunyomi', key: 'romaji_kunyomi', width: 14 },
      { header: 'Contoh Kata Onyomi', key: 'contoh_onyomi', width: 22 },
      { header: 'Arti Onyomi', key: 'arti_onyomi', width: 18 },
      { header: 'Contoh Kata Kunyomi', key: 'contoh_kunyomi', width: 22 },
      { header: 'Arti Kunyomi', key: 'arti_kunyomi', width: 18 },
      { header: 'Mnemonik', key: 'mnemonik', width: 24 },
      { header: 'GIF Cara Menulis Kanji', key: 'gif_kanji', width: 36 },
      { header: 'Contoh Kalimat', key: 'contoh_kalimat', width: 28 },
    ],
    {
      lesson_external_id: 'pelajaran-kanji-1',
      track: 'KANJI',
      kategori: 'Angka',
      huruf: '一',
      furigana: 'いち',
      romaji: 'ichi',
      arti: 'satu',
      romaji_onyomi: 'ichi',
      romaji_kunyomi: 'hito',
      contoh_onyomi: 'いちばん',
      arti_onyomi: 'nomor satu',
      contoh_kunyomi: 'ひとつ',
      arti_kunyomi: 'satu buah',
      mnemonik: 'Seperti satu garis lurus',
      gif_kanji: 'https://example.com/kanji-ichi.gif',
      contoh_kalimat: '',
    },
  );

  addDataSheet(
    workbook,
    '7. Quiz',
    'FFDC2626',
    'Pilihan jawaban: satu opsi per baris, format "1. teks". Jawaban benar: nomor atau teks opsi. Semua soal diimpor sebagai kuis pelajaran (tryout JLPT ada di menu impor terpisah).',
    [
      { header: 'ID Eksternal Pelajaran', key: 'lesson_external_id', width: 26, required: true },
      { header: 'No', key: 'no', width: 6 },
      { header: 'Pertanyaan', key: 'pertanyaan', width: 36, required: true },
      { header: 'Pilihan Jawaban', key: 'pilihan_jawaban', width: 32, required: true },
      { header: 'Jawaban Benar', key: 'jawaban_benar', width: 16, required: true },
      { header: 'Penjelasan', key: 'penjelasan', width: 28 },
    ],
    {
      lesson_external_id: 'pelajaran-kuis-1',
      no: 1,
      pertanyaan: 'Arti 一 adalah?',
      pilihan_jawaban: '1. satu\n2. dua\n3. tiga',
      jawaban_benar: '1',
      penjelasan: '一 (ichi) berarti satu.',
    },
  );

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
