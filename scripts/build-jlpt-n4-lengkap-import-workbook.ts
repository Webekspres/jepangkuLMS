/**
 * Generates `docs/JLPT N4 Lengkap - Import.xlsx` using official-course-v1 template.
 * Material sourced from `docs/Materi LMS sensei N4.xlsx`.
 *
 * Run: bun run scripts/build-jlpt-n4-lengkap-import-workbook.ts
 */
import ExcelJS from 'exceljs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  OFFICIAL_COURSE_V1_METADATA_SHEET,
  OFFICIAL_COURSE_V1_TEMPLATE_KEY,
  OFFICIAL_COURSE_V1_TEMPLATE_VERSION,
} from '@/features/admin-cms/lib/import-framework/official-course-v1-metadata';
import { parseCorrectAnswer, parseQuizOptions } from '@/features/admin-cms/lib/import-framework/sensei-jlpt-v1-shared';
import type { ColDef } from '@/features/admin-cms/lib/xlsx-template-builder';
import { previewCourseImport } from '@/features/admin-cms/lib/import-framework/import-course-workbook';
import { addDataSheet, addGuideSheet } from '@/features/admin-cms/lib/xlsx-template-builder';

const MATERI_PATH = path.join(process.cwd(), 'docs', 'Materi LMS sensei N4.xlsx');
const OUTPUT_PATH = path.join(process.cwd(), 'docs', 'JLPT N4 Lengkap - Import.xlsx');
const VIDEO_PLACEHOLDER = 'https://www.youtube.com/watch?v=QgtZW5eNWLc&t=3s';
const COURSE_ID = 'jlpt-n4-lengkap';

type LessonDef = { title: string; type: 'VIDEO' | 'FLASHCARD' | 'QUIZ' | 'TEXT' };
type ModuleDef = { title: string; lessons: LessonDef[] };

const CURRICULUM: ModuleDef[] = [
  {
    title: 'Modul 1 — Pengenalan Kursus',
    lessons: [
      { title: 'Selamat Datang di Kursus JLPT N4', type: 'VIDEO' },
      { title: 'Cara Belajar Efektif di Jepangku', type: 'VIDEO' },
    ],
  },
  {
    title: 'Modul 2 — Tata Bahasa Dasar',
    lessons: [
      { title: 'Dugaan & Kemungkinan', type: 'VIDEO' },
      { title: 'Kondisional / Pengandaian', type: 'VIDEO' },
      { title: 'Tujuan & Alasan', type: 'VIDEO' },
      { title: 'Perubahan & Usaha', type: 'VIDEO' },
      { title: 'Quiz Tata Bahasa Dasar', type: 'QUIZ' },
    ],
  },
  {
    title: 'Modul 3 — Tata Bahasa Menengah',
    lessons: [
      { title: 'Bentuk Te & Hubungan Kalimat', type: 'VIDEO' },
      { title: 'Pemberian & Penerimaan', type: 'VIDEO' },
      { title: 'Perintah, Larangan & Saran', type: 'VIDEO' },
      { title: 'Keinginan, Harapan & Rencana', type: 'VIDEO' },
      { title: 'Quiz Tata Bahasa Menengah', type: 'QUIZ' },
    ],
  },
  {
    title: 'Modul 4 — Tata Bahasa Lanjutan',
    lessons: [
      { title: 'Bentuk Pasif, Kausatif & Kausatif Pasif', type: 'VIDEO' },
      { title: 'Waktu, Durasi & Urutan Kejadian', type: 'VIDEO' },
      { title: 'Perbandingan & Perasaan Orang Ketiga', type: 'VIDEO' },
      { title: 'Keigo Dasar & Ekspresi Penting JLPT N4', type: 'VIDEO' },
      { title: 'Quiz Tata Bahasa Lanjutan', type: 'QUIZ' },
    ],
  },
  {
    title: 'Modul 5 — Kosakata JLPT N4 Bagian 1',
    lessons: [
      { title: 'Kosakata Tema Alam', type: 'FLASHCARD' },
      { title: 'Kosakata Tema Benda', type: 'FLASHCARD' },
      { title: 'Kosakata Tema Tempat', type: 'FLASHCARD' },
      { title: 'Kosakata Tema Waktu', type: 'FLASHCARD' },
      { title: 'Quiz Kosakata Bagian 1', type: 'QUIZ' },
    ],
  },
  {
    title: 'Modul 6 — Kosakata JLPT N4 Bagian 2',
    lessons: [
      { title: 'Kosakata Tema Aktivitas Sehari-hari', type: 'FLASHCARD' },
      { title: 'Kosakata Tema Pekerjaan & Pendidikan', type: 'FLASHCARD' },
      { title: 'Kosakata Tema Perasaan & Kondisi', type: 'FLASHCARD' },
      { title: 'Kosakata Tema Sosial & Kehidupan', type: 'FLASHCARD' },
      { title: 'Quiz Kosakata Bagian 2', type: 'QUIZ' },
    ],
  },
  {
    title: 'Modul 7 — Kanji JLPT N4 Bagian 1',
    lessons: [
      { title: 'Kanji Alam & Musim', type: 'FLASHCARD' },
      { title: 'Kanji Tempat & Lingkungan', type: 'FLASHCARD' },
      { title: 'Kanji Waktu', type: 'FLASHCARD' },
      { title: 'Kanji Kehidupan Sehari-hari', type: 'FLASHCARD' },
      { title: 'Quiz Kanji Bagian 1', type: 'QUIZ' },
    ],
  },
  {
    title: 'Modul 8 — Kanji JLPT N4 Bagian 2',
    lessons: [
      { title: 'Kanji Aktivitas & Kata Kerja', type: 'FLASHCARD' },
      { title: 'Kanji Pendidikan & Pekerjaan', type: 'FLASHCARD' },
      { title: 'Kanji Masyarakat & Kehidupan', type: 'FLASHCARD' },
      { title: 'Kanji Tambahan JLPT N4', type: 'FLASHCARD' },
      { title: 'Quiz Kanji Bagian 2', type: 'QUIZ' },
    ],
  },
  {
    title: 'Modul 9 — Dokkai (Membaca)',
    lessons: [
      { title: 'Strategi Mengerjakan Dokkai JLPT N4', type: 'VIDEO' },
      { title: 'Dokkai Latihan 1', type: 'QUIZ' },
      { title: 'Dokkai Latihan 2', type: 'QUIZ' },
    ],
  },
  {
    title: 'Modul 10 — Choukai (Mendengarkan)',
    lessons: [
      { title: 'Pengenalan Choukai JLPT N4', type: 'VIDEO' },
      { title: 'Choukai Percakapan Sehari-hari', type: 'VIDEO' },
      { title: 'Choukai Situasi di Sekolah & Tempat Kerja', type: 'VIDEO' },
      { title: 'Choukai Tips Menjawab Soal JLPT N4', type: 'VIDEO' },
    ],
  },
  {
    title: 'Modul 11 — Review & Persiapan Ujian',
    lessons: [
      { title: 'Review Tata Bahasa Penting', type: 'VIDEO' },
      { title: 'Review Kosakata & Kanji', type: 'FLASHCARD' },
      { title: 'Quiz Akhir Kursus', type: 'QUIZ' },
    ],
  },
];

const JLPT_LEVEL_OPTIONS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const YES_NO_OPTIONS = ['Ya', 'Tidak'] as const;
const LESSON_TYPE_OPTIONS = ['VIDEO', 'FLASHCARD', 'QUIZ', 'TEXT'] as const;
const FLASHCARD_TRACK_OPTIONS = ['KANJI', 'KOSAKATA', 'TATA_BAHASA'] as const;

const COURSE_COLS: ColDef[] = [
  { header: 'ID Eksternal Kursus', key: 'course_external_id', width: 24, required: true },
  { header: 'Judul', key: 'judul', width: 32, required: true },
  { header: 'Deskripsi', key: 'deskripsi', width: 36 },
  { header: 'Level', key: 'level', width: 12, listOptions: [...JLPT_LEVEL_OPTIONS] },
  { header: 'Publikasi', key: 'publikasi', width: 14, listOptions: [...YES_NO_OPTIONS] },
];

const MODULE_COLS: ColDef[] = [
  { header: 'ID Eksternal Modul', key: 'module_external_id', width: 24, required: true },
  { header: 'ID Eksternal Kursus', key: 'course_external_id', width: 24, required: true },
  { header: 'Judul', key: 'judul', width: 32, required: true },
  { header: 'Urutan', key: 'urutan', width: 10, required: true },
  { header: 'Deskripsi', key: 'deskripsi', width: 32 },
];

const LESSON_COLS: ColDef[] = [
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
];

const VIDEO_COLS: ColDef[] = [
  { header: 'ID Eksternal Pelajaran', key: 'lesson_external_id', width: 26, required: true },
  { header: 'URL Video', key: 'video_url', width: 40, required: true },
  { header: 'Teks Konten', key: 'teks_konten', width: 36 },
];

const FLASHCARD_COLS: ColDef[] = [
  { header: 'ID Eksternal Pelajaran', key: 'lesson_external_id', width: 26, required: true },
  { header: 'Track', key: 'track', width: 14, required: true, listOptions: [...FLASHCARD_TRACK_OPTIONS] },
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
];

const QUIZ_COLS: ColDef[] = [
  { header: 'ID Eksternal Pelajaran', key: 'lesson_external_id', width: 26, required: true },
  { header: 'No', key: 'no', width: 6 },
  { header: 'Pertanyaan', key: 'pertanyaan', width: 36, required: true },
  { header: 'Pilihan Jawaban', key: 'pilihan_jawaban', width: 32, required: true },
  { header: 'Jawaban Benar', key: 'jawaban_benar', width: 16, required: true },
  { header: 'Penjelasan', key: 'penjelasan', width: 28 },
];

type KanjiRow = {
  kategori: string;
  huruf: string;
  furigana: string;
  romaji: string;
  arti: string;
  contohKunyomi: string;
  romajiKunyomi: string;
  artiKunyomi: string;
  contohOnyomi: string;
  romajiOnyomi: string;
  artiOnyomi: string;
  mnemonik: string;
};

type KosakataRow = {
  kategori: string;
  kosakata: string;
  furigana: string;
  romaji: string;
  arti: string;
  contohKalimat: string;
};

type TataBahasaRow = {
  kategori: string;
  tataBahasa: string;
  arti: string;
  contohKalimat: string;
};

type QuizRow = {
  no: number;
  pertanyaan: string;
  pilihanJawaban: string;
  jawabanBenar: string;
  penjelasan: string;
};

type MateriData = {
  kanji: KanjiRow[];
  kosakata: KosakataRow[];
  tataBahasa: TataBahasaRow[];
  quiz1: QuizRow[];
  quiz2: QuizRow[];
  dokkai: QuizRow[];
};

type LessonRef = {
  moduleId: string;
  lessonId: string;
  title: string;
  type: LessonDef['type'];
  moduleTitle: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function cellVal(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.map((part) => part.text).join('');
  }
  if (typeof value === 'object' && value !== null && 'text' in value) return String(value.text);
  if (typeof value === 'object' && value !== null && 'hyperlink' in value) {
    return String((value as { hyperlink?: unknown }).hyperlink ?? '');
  }
  if (typeof value === 'object' && 'result' in value) return String(value.result ?? '');
  return String(value);
}

function isValidQuizRow(row: QuizRow): boolean {
  const options = parseQuizOptions(row.pilihanJawaban);
  const correctIndex = parseCorrectAnswer(row.jawabanBenar, options);
  return Boolean(row.pertanyaan.trim()) && options.length >= 2 && correctIndex >= 0;
}

function parseQuizSheet(sheet: ExcelJS.Worksheet | undefined): QuizRow[] {
  const rows: QuizRow[] = [];
  if (!sheet) return rows;
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const pertanyaan = cellVal(row.getCell(2)).trim();
    const pilihanJawaban = cellVal(row.getCell(3)).trim();
    const jawabanBenar = cellVal(row.getCell(4)).trim();
    if (!pertanyaan || !pilihanJawaban || !jawabanBenar) continue;
    if (pertanyaan.includes('もんだい') && pilihanJawaban.length < 4) continue;
    const candidate: QuizRow = {
      no: rows.length + 1,
      pertanyaan,
      pilihanJawaban,
      jawabanBenar,
      penjelasan: cellVal(row.getCell(5)),
    };
    if (!isValidQuizRow(candidate)) continue;
    rows.push(candidate);
  }
  return rows;
}

function parseMateriWorkbook(workbook: ExcelJS.Workbook): MateriData {
  const kanjiSheet = workbook.getWorksheet('N4 - 漢字 (Kanji)');
  const kosakataSheet = workbook.getWorksheet('N4 - 語彙 (Kosakata)');
  const tataBahasaSheet = workbook.getWorksheet('N4 - 文法 (Tata Bahasa)');
  const quiz1Sheet = workbook.getWorksheet('N4 - Quiz 1');
  const quiz2Sheet = workbook.getWorksheet('N4 - Quiz 2');
  const tryoutSheet = workbook.getWorksheet('N4 - Try Out 1');

  const kanji: KanjiRow[] = [];
  if (kanjiSheet) {
    for (let r = 2; r <= kanjiSheet.rowCount; r++) {
      const row = kanjiSheet.getRow(r);
      const huruf = cellVal(row.getCell(3));
      if (!huruf.trim()) continue;
      kanji.push({
        kategori: cellVal(row.getCell(2)),
        huruf,
        furigana: cellVal(row.getCell(4)),
        romaji: cellVal(row.getCell(5)),
        arti: cellVal(row.getCell(6)),
        contohKunyomi: cellVal(row.getCell(7)),
        romajiKunyomi: cellVal(row.getCell(8)),
        artiKunyomi: cellVal(row.getCell(9)),
        contohOnyomi: cellVal(row.getCell(10)),
        romajiOnyomi: cellVal(row.getCell(11)),
        artiOnyomi: cellVal(row.getCell(12)),
        mnemonik: cellVal(row.getCell(16)),
      });
    }
  }

  const kosakata: KosakataRow[] = [];
  if (kosakataSheet) {
    for (let r = 2; r <= kosakataSheet.rowCount; r++) {
      const row = kosakataSheet.getRow(r);
      const term = cellVal(row.getCell(3));
      if (!term.trim()) continue;
      kosakata.push({
        kategori: cellVal(row.getCell(2)),
        kosakata: term,
        furigana: cellVal(row.getCell(4)),
        romaji: cellVal(row.getCell(5)),
        arti: cellVal(row.getCell(6)),
        contohKalimat: cellVal(row.getCell(7)),
      });
    }
  }

  const tataBahasa: TataBahasaRow[] = [];
  if (tataBahasaSheet) {
    for (let r = 2; r <= tataBahasaSheet.rowCount; r++) {
      const row = tataBahasaSheet.getRow(r);
      const pattern = cellVal(row.getCell(3));
      if (!pattern.trim()) continue;
      tataBahasa.push({
        kategori: cellVal(row.getCell(2)),
        tataBahasa: pattern,
        arti: cellVal(row.getCell(4)),
        contohKalimat: cellVal(row.getCell(5)),
      });
    }
  }

  const quiz1 = parseQuizSheet(quiz1Sheet);
  const quiz2 = parseQuizSheet(quiz2Sheet);
  const tryoutRows = parseQuizSheet(tryoutSheet);
  const dokkai = tryoutRows.filter(
    (row) =>
      /もんだい[３3４4]|ぶんしょう|文法・読解|読みました|さくぶん/.test(row.pertanyaan) ||
      row.pertanyaan.length > 80,
  );

  return { kanji, kosakata, tataBahasa, quiz1, quiz2, dokkai };
}

function kosakataFlashcards(
  lessonId: string,
  rows: KosakataRow[],
  categoryLabel: string,
): Record<string, string | number>[] {
  return rows.map((row) => ({
    lesson_external_id: lessonId,
    track: 'KOSAKATA',
    kategori: row.kategori || categoryLabel,
    huruf: row.kosakata,
    furigana: row.furigana,
    romaji: row.romaji,
    arti: row.arti,
    contoh_kalimat: row.contohKalimat,
  }));
}

function kanjiFlashcards(lessonId: string, rows: KanjiRow[]): Record<string, string | number>[] {
  return rows.map((row) => ({
    lesson_external_id: lessonId,
    track: 'KANJI',
    kategori: row.kategori,
    huruf: row.huruf,
    furigana: row.furigana,
    romaji: row.romaji,
    arti: row.arti,
    romaji_onyomi: row.romajiOnyomi,
    romaji_kunyomi: row.romajiKunyomi,
    contoh_onyomi: row.contohOnyomi,
    arti_onyomi: row.artiOnyomi,
    contoh_kunyomi: row.contohKunyomi,
    arti_kunyomi: row.artiKunyomi,
    mnemonik: row.mnemonik,
  }));
}

function tataBahasaFlashcards(
  lessonId: string,
  rows: TataBahasaRow[],
): Record<string, string | number>[] {
  return rows.map((row) => ({
    lesson_external_id: lessonId,
    track: 'TATA_BAHASA',
    kategori: row.kategori,
    huruf: row.tataBahasa,
    arti: row.arti,
    contoh_kalimat: row.contohKalimat,
  }));
}

function quizRowsForLesson(lessonId: string, questions: QuizRow[]): Record<string, string | number>[] {
  return questions.map((q, index) => ({
    lesson_external_id: lessonId,
    no: index + 1,
    pertanyaan: q.pertanyaan,
    pilihan_jawaban: q.pilihanJawaban,
    jawaban_benar: q.jawabanBenar,
    penjelasan: q.penjelasan,
  }));
}

function filterKosakata(data: MateriData, categories: string[]): KosakataRow[] {
  return data.kosakata.filter((row) => categories.includes(row.kategori));
}

function filterKanji(data: MateriData, categories: string[]): KanjiRow[] {
  return data.kanji.filter((row) => categories.includes(row.kategori));
}

function filterTataBahasa(data: MateriData, categories: string[]): TataBahasaRow[] {
  return data.tataBahasa.filter((row) => categories.includes(row.kategori));
}

function buildLessonRefs(): LessonRef[] {
  const refs: LessonRef[] = [];
  CURRICULUM.forEach((module, moduleIndex) => {
    const moduleId = `m${String(moduleIndex + 1).padStart(2, '0')}-${slugify(module.title.replace(/^Modul \d+ — /, ''))}`;
    module.lessons.forEach((lesson, lessonIndex) => {
      refs.push({
        moduleId,
        lessonId: `${moduleId}-l${String(lessonIndex + 1).padStart(2, '0')}-${slugify(lesson.title)}`,
        title: lesson.title,
        type: lesson.type,
        moduleTitle: module.title,
      });
    });
  });
  return refs;
}

function flashcardsForLesson(lesson: LessonRef, data: MateriData): Record<string, string | number>[] {
  switch (lesson.title) {
    case 'Kosakata Tema Alam':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Alam']), 'Alam');
    case 'Kosakata Tema Benda':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Benda', 'Objek']), 'Benda');
    case 'Kosakata Tema Tempat':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Tempat']), 'Tempat');
    case 'Kosakata Tema Waktu':
      return kosakataFlashcards(
        lesson.lessonId,
        filterKosakata(data, ['Keterangan (Waktu)', 'Keterangan (Waktu/Hasil)', 'Keterangan (Kepastian)']),
        'Waktu',
      );
    case 'Kosakata Tema Aktivitas Sehari-hari':
      return kosakataFlashcards(
        lesson.lessonId,
        filterKosakata(data, ['Aktivitas Fisik', 'Kegiatan', 'Ungkapan Harian']),
        'Aktivitas',
      );
    case 'Kosakata Tema Pekerjaan & Pendidikan':
      return kosakataFlashcards(
        lesson.lessonId,
        filterKosakata(data, ['Kognitif', 'Komunikasi', 'Keadaan (Trans)', 'Keadaan (Intrans)']),
        'Pekerjaan & Pendidikan',
      );
    case 'Kosakata Tema Perasaan & Kondisi':
      return kosakataFlashcards(
        lesson.lessonId,
        filterKosakata(data, [
          'Emosi',
          'Kata Sifat (Perasaan/Karakter)',
          'Kata Sifat (Situasi/Kondisi)',
          'Kondisi',
          'Keadaan',
        ]),
        'Perasaan & Kondisi',
      );
    case 'Kosakata Tema Sosial & Kehidupan':
      return kosakataFlashcards(
        lesson.lessonId,
        filterKosakata(data, ['Sosial', 'Abstrak', 'Konsep', 'Komunikasi', 'Kata Hubung', 'Kata Penunjuk']),
        'Sosial & Kehidupan',
      );
    case 'Kanji Alam & Musim':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Alam', 'Alam & Musim', 'Alam & Cuaca']));
    case 'Kanji Tempat & Lingkungan':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Tempat', 'Alam & Tempat', 'Arah']));
    case 'Kanji Waktu':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Waktu', 'Waktu & Sifat']));
    case 'Kanji Kehidupan Sehari-hari':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Benda', 'Keluarga', 'Makanan', 'Konsep']));
    case 'Kanji Aktivitas & Kata Kerja':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Kata Kerja']));
    case 'Kanji Pendidikan & Pekerjaan':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Angka & Konsep', 'Konsep']));
    case 'Kanji Masyarakat & Kehidupan':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Keluarga', 'Sifat', 'Fisik', 'Hewan']));
    case 'Kanji Tambahan JLPT N4':
      return kanjiFlashcards(
        lesson.lessonId,
        filterKanji(data, ['Makanan & Hewan', 'Sifat & Makanan', 'Hewan', 'Fisik', 'Sifat']),
      );
    case 'Review Kosakata & Kanji':
      return [
        ...kosakataFlashcards(
          lesson.lessonId,
          filterKosakata(data, ['Alam', 'Tempat', 'Emosi', 'Sosial', 'Ungkapan Harian']).slice(0, 30),
          'Review Kosakata',
        ),
        ...kanjiFlashcards(
          lesson.lessonId,
          filterKanji(data, ['Alam', 'Waktu', 'Tempat', 'Kata Kerja', 'Keluarga']).slice(0, 30),
        ),
        ...tataBahasaFlashcards(
          lesson.lessonId,
          filterTataBahasa(data, [
            'Dugaan & Kemungkinan',
            'Kondisional (Pengandaian)',
            'Tujuan & Alasan',
            'Perubahan & Usaha',
            'Bentuk Te (Kondisi)',
            'Pemberian/Penerimaan',
            'Perintah & Saran',
            'Niat & Rencana',
          ]),
        ),
      ];
    default:
      return [];
  }
}

function assignQuizQuestions(lessons: LessonRef[], data: MateriData): Map<string, QuizRow[]> {
  const quizLessons = lessons.filter((lesson) => lesson.type === 'QUIZ');
  const pool = [...data.quiz1, ...data.quiz2];
  const dokkaiLessons = quizLessons.filter((lesson) => lesson.title.startsWith('Dokkai Latihan'));
  const finalQuiz = quizLessons.find((lesson) => lesson.title === 'Quiz Akhir Kursus');
  const regularQuizLessons = quizLessons.filter(
    (lesson) => !lesson.title.startsWith('Dokkai Latihan') && lesson.title !== 'Quiz Akhir Kursus',
  );

  const assigned = new Map<string, QuizRow[]>();
  const perLesson = Math.max(5, Math.floor(pool.length / regularQuizLessons.length));
  let cursor = 0;

  for (const lesson of regularQuizLessons) {
    assigned.set(lesson.lessonId, pool.slice(cursor, cursor + perLesson));
    cursor += perLesson;
  }

  const dokkaiPool = data.dokkai.length >= 6 ? data.dokkai : pool.slice(-16);
  const dokkaiChunk = Math.max(4, Math.floor(dokkaiPool.length / dokkaiLessons.length));
  dokkaiLessons.forEach((lesson, index) => {
    const start = index * dokkaiChunk;
    assigned.set(lesson.lessonId, dokkaiPool.slice(start, start + dokkaiChunk));
  });

  if (finalQuiz) {
    const remainder = pool.slice(cursor);
    const tryoutTail = data.dokkai.slice(0, 8);
    assigned.set(finalQuiz.lessonId, [...remainder, ...tryoutTail].slice(0, 15));
  }

  return assigned;
}

function writeDataRows(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  columns: ColDef[],
  rows: Record<string, string | number>[],
) {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  if (rows.length === 0) {
    sheet.spliceRows(4, 1);
    return;
  }

  for (let i = 0; i < rows.length; i++) {
    const excelRow = sheet.getRow(4 + i);
    columns.forEach((col, colIndex) => {
      excelRow.getCell(colIndex + 1).value = rows[i]![col.key] ?? '';
    });
  }
}

function addMetadataSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet(OFFICIAL_COURSE_V1_METADATA_SHEET, { state: 'veryHidden' });
  sheet.getCell('A1').value = 'key';
  sheet.getCell('B1').value = 'value';
  sheet.getCell('A2').value = 'templateKey';
  sheet.getCell('B2').value = OFFICIAL_COURSE_V1_TEMPLATE_KEY;
  sheet.getCell('A3').value = 'templateVersion';
  sheet.getCell('B3').value = OFFICIAL_COURSE_V1_TEMPLATE_VERSION;
  sheet.getCell('A4').value = 'authoredFor';
  sheet.getCell('B4').value = 'JepangKu LMS';
}

async function main() {
  const materiWorkbook = new ExcelJS.Workbook();
  await materiWorkbook.xlsx.readFile(MATERI_PATH);
  const materi = parseMateriWorkbook(materiWorkbook);
  const lessonRefs = buildLessonRefs();
  const quizAssignments = assignQuizQuestions(lessonRefs, materi);

  const moduleRows = CURRICULUM.map((module, index) => ({
    module_external_id: `m${String(index + 1).padStart(2, '0')}-${slugify(module.title.replace(/^Modul \d+ — /, ''))}`,
    course_external_id: COURSE_ID,
    judul: module.title,
    urutan: index + 1,
    deskripsi: module.title,
  }));

  const lessonRows: Record<string, string | number>[] = [];
  const videoRows: Record<string, string | number>[] = [];
  const flashcardRows: Record<string, string | number>[] = [];
  const quizRows: Record<string, string | number>[] = [];

  lessonRefs.forEach((lesson) => {
    const order =
      CURRICULUM.find((courseModule) => courseModule.title === lesson.moduleTitle)?.lessons.findIndex(
        (item) => item.title === lesson.title,
      ) ?? 0;

    lessonRows.push({
      lesson_external_id: lesson.lessonId,
      module_external_id: lesson.moduleId,
      judul: lesson.title,
      urutan: order + 1,
      tipe_pelajaran: lesson.type,
    });

    if (lesson.type === 'VIDEO') {
      videoRows.push({
        lesson_external_id: lesson.lessonId,
        video_url: VIDEO_PLACEHOLDER,
        teks_konten: `Materi video: ${lesson.title}`,
      });
    }

    if (lesson.type === 'FLASHCARD') {
      flashcardRows.push(...flashcardsForLesson(lesson, materi));
    }

    if (lesson.type === 'QUIZ') {
      quizRows.push(...quizRowsForLesson(lesson.lessonId, quizAssignments.get(lesson.lessonId) ?? []));
    }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JepangKu LMS';
  addMetadataSheet(workbook);

  addGuideSheet(workbook, [
    'Workbook impor kursus JLPT N4 Lengkap — template resmi v1.',
    'Materi flashcard & kuis diambil dari docs/Materi LMS sensei N4.xlsx.',
    'Video memakai placeholder YouTube — ganti URL setelah materi video tersedia.',
    'Modul Choukai hanya berisi video pembelajaran (tanpa quiz audio di course).',
    'Unggah di /admin/kursus/import setelah pratinjau valid.',
  ]);

  addDataSheet(workbook, '1. Course', 'FF0F766E', 'Satu baris kursus.', COURSE_COLS, {
    course_external_id: COURSE_ID,
    judul: 'JLPT N4 Lengkap',
    deskripsi:
      'Kurikulum lengkap JLPT N4: tata bahasa, kosakata, kanji, dokkai, choukai, dan persiapan ujian.',
    level: 'N4',
    publikasi: 'Tidak',
  });

  addDataSheet(workbook, '2. Module', 'FF059669', 'Satu baris per modul.', MODULE_COLS, moduleRows[0]!);
  addDataSheet(workbook, '3. Lesson', 'FF0284C7', 'Satu baris per pelajaran.', LESSON_COLS, {
    lesson_external_id: lessonRows[0]!.lesson_external_id as string,
    module_external_id: lessonRows[0]!.module_external_id as string,
    judul: lessonRows[0]!.judul as string,
    urutan: lessonRows[0]!.urutan as number,
    tipe_pelajaran: lessonRows[0]!.tipe_pelajaran as string,
  });
  addDataSheet(workbook, '4. Video', 'FF7C3AED', 'Satu baris per pelajaran VIDEO.', VIDEO_COLS, videoRows[0] ?? {
    lesson_external_id: 'placeholder',
    video_url: VIDEO_PLACEHOLDER,
    teks_konten: '',
  });
  addDataSheet(workbook, '6. Flashcard', 'FFF59E0B', 'Konten flashcard per pelajaran.', FLASHCARD_COLS, flashcardRows[0] ?? {
    lesson_external_id: 'placeholder',
    track: 'KOSAKATA',
    huruf: '自然',
    romaji: 'shizen',
    arti: 'contoh',
  });
  addDataSheet(workbook, '7. Quiz', 'FFDC2626', 'Soal kuis per pelajaran QUIZ.', QUIZ_COLS, quizRows[0] ?? {
    lesson_external_id: 'placeholder',
    no: 1,
    pertanyaan: 'Contoh pertanyaan?',
    pilihan_jawaban: '1. A\n2. B',
    jawaban_benar: '1',
  });

  writeDataRows(workbook, '2. Module', MODULE_COLS, moduleRows);
  writeDataRows(workbook, '3. Lesson', LESSON_COLS, lessonRows);
  writeDataRows(workbook, '4. Video', VIDEO_COLS, videoRows);
  writeDataRows(workbook, '6. Flashcard', FLASHCARD_COLS, flashcardRows);
  writeDataRows(workbook, '7. Quiz', QUIZ_COLS, quizRows);

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  await fs.writeFile(OUTPUT_PATH, buffer);

  const preview = await previewCourseImport(buffer);
  console.log(`Written: ${OUTPUT_PATH}`);
  console.log(
    `Stats: ${moduleRows.length} modul, ${lessonRows.length} pelajaran, ${flashcardRows.length} flashcard, ${quizRows.length} soal`,
  );
  console.log(`Preview: ${preview.ok ? 'OK' : 'GAGAL'} — ${preview.errors.length} error`);
  if (!preview.ok) {
    for (const error of preview.errors.slice(0, 15)) {
      console.log(`  - [${error.code ?? 'ERR'}] ${error.message}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
