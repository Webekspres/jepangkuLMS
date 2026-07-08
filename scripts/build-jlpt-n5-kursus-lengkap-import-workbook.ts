/**
 * Generates `docs/JLPT N5 Kursus Lengkap - Import.xlsx` using official-course-v1 template.
 * Material sourced from `docs/Materi LMS terbaru.xlsx`.
 *
 * Run: bun run scripts/build-jlpt-n5-kursus-lengkap-import-workbook.ts
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

const MATERI_PATH = path.join(process.cwd(), 'docs', 'Materi LMS terbaru.xlsx');
const OUTPUT_PATH = path.join(process.cwd(), 'docs', 'JLPT N5 Kursus Lengkap - Import.xlsx');
const VIDEO_PLACEHOLDER = 'https://www.youtube.com/watch?v=QgtZW5eNWLc&t=3s';
const COURSE_ID = 'jlpt-n5-kursus-lengkap';

type LessonDef = { title: string; type: 'VIDEO' | 'FLASHCARD' | 'QUIZ' | 'TEXT' };
type ModuleDef = { title: string; lessons: LessonDef[] };

const CURRICULUM: ModuleDef[] = [
  {
    title: 'Module 1 — Pengenalan Kursus',
    lessons: [
      { title: 'Selamat Datang di Kursus JLPT N5 Lengkap', type: 'VIDEO' },
      { title: 'Cara Menggunakan LMS JepangKu', type: 'VIDEO' },
      { title: 'Tips Belajar Bahasa Jepang Secara Efektif', type: 'VIDEO' },
    ],
  },
  {
    title: 'Module 2 — Hiragana',
    lessons: [
      { title: 'Mengenal Huruf Hiragana', type: 'VIDEO' },
      { title: 'Huruf Dasar Hiragana', type: 'FLASHCARD' },
      { title: 'Huruf Dakuon dan Handakuon', type: 'FLASHCARD' },
      { title: 'Huruf Kombinasi (Youon)', type: 'FLASHCARD' },
      { title: 'Latihan Membaca Hiragana', type: 'VIDEO' },
      { title: 'Quiz Hiragana', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 3 — Katakana',
    lessons: [
      { title: 'Mengenal Huruf Katakana', type: 'VIDEO' },
      { title: 'Huruf Dasar Katakana', type: 'FLASHCARD' },
      { title: 'Huruf Dakuon dan Handakuon', type: 'FLASHCARD' },
      { title: 'Huruf Kombinasi (Youon)', type: 'FLASHCARD' },
      { title: 'Kata Serapan dalam Katakana', type: 'FLASHCARD' },
      { title: 'Quiz Katakana', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 4 — Salam dan Percakapan Dasar',
    lessons: [
      { title: 'Salam dalam Bahasa Jepang', type: 'VIDEO' },
      { title: 'Memperkenalkan Diri', type: 'VIDEO' },
      { title: 'Ungkapan Sehari-hari', type: 'FLASHCARD' },
      { title: 'Percakapan Dasar', type: 'VIDEO' },
      { title: 'Quiz Salam dan Percakapan', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 5 — Tata Bahasa Dasar',
    lessons: [
      { title: 'Pola Kalimat Dasar', type: 'VIDEO' },
      { title: 'Penggunaan Partikel Dasar', type: 'VIDEO' },
      { title: 'Kata Kerja Bentuk Sopan', type: 'VIDEO' },
      { title: 'Kata Sifat', type: 'VIDEO' },
      { title: 'Kalimat Negatif', type: 'VIDEO' },
      { title: 'Kalimat Lampau', type: 'VIDEO' },
      { title: 'Kalimat Tanya', type: 'VIDEO' },
      { title: 'Ringkasan Tata Bahasa', type: 'FLASHCARD' },
      { title: 'Quiz Tata Bahasa Dasar', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 6 — Kosakata Angka dan Waktu',
    lessons: [
      { title: 'Mengenal Angka dalam Bahasa Jepang', type: 'VIDEO' },
      { title: 'Flashcard Angka', type: 'FLASHCARD' },
      { title: 'Hari, Bulan, dan Tanggal', type: 'FLASHCARD' },
      { title: 'Jam dan Waktu', type: 'FLASHCARD' },
      { title: 'Quiz Angka dan Waktu', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 7 — Kosakata Orang dan Keluarga',
    lessons: [
      { title: 'Anggota Keluarga', type: 'FLASHCARD' },
      { title: 'Pekerjaan dan Profesi', type: 'FLASHCARD' },
      { title: 'Hubungan Sosial', type: 'FLASHCARD' },
      { title: 'Quiz Orang dan Keluarga', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 8 — Kosakata Kehidupan Sehari-hari',
    lessons: [
      { title: 'Bagian Rumah', type: 'FLASHCARD' },
      { title: 'Sekolah dan Kelas', type: 'FLASHCARD' },
      { title: 'Benda Sehari-hari', type: 'FLASHCARD' },
      { title: 'Warna dan Bentuk', type: 'FLASHCARD' },
      { title: 'Quiz Kehidupan Sehari-hari', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 9 — Kosakata Makanan dan Minuman',
    lessons: [
      { title: 'Nama Makanan', type: 'FLASHCARD' },
      { title: 'Nama Minuman', type: 'FLASHCARD' },
      { title: 'Berbelanja Makanan', type: 'VIDEO' },
      { title: 'Quiz Makanan dan Minuman', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 10 — Kosakata Transportasi dan Tempat',
    lessons: [
      { title: 'Jenis Kendaraan', type: 'FLASHCARD' },
      { title: 'Tempat Umum', type: 'FLASHCARD' },
      { title: 'Menanyakan Arah dan Lokasi', type: 'VIDEO' },
      { title: 'Quiz Transportasi dan Tempat', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 11 — Kanji Dasar JLPT N5',
    lessons: [
      { title: 'Mengenal Kanji Dasar', type: 'VIDEO' },
      { title: 'Kanji Angka', type: 'FLASHCARD' },
      { title: 'Kanji Hari dan Waktu', type: 'FLASHCARD' },
      { title: 'Kanji Alam', type: 'FLASHCARD' },
      { title: 'Kanji Orang dan Keluarga', type: 'FLASHCARD' },
      { title: 'Kanji Tempat', type: 'FLASHCARD' },
      { title: 'Kanji Sekolah', type: 'FLASHCARD' },
      { title: 'Quiz Kanji Dasar', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 12 — Pola Kalimat Penting',
    lessons: [
      { title: 'Kalimat Pernyataan Dasar', type: 'VIDEO' },
      { title: 'Menyatakan Keberadaan Orang dan Benda', type: 'VIDEO' },
      { title: 'Mengajak dan Memberi Saran', type: 'VIDEO' },
      { title: 'Memberikan Izin', type: 'VIDEO' },
      { title: 'Larangan', type: 'VIDEO' },
      { title: 'Menyatakan Keinginan', type: 'VIDEO' },
      { title: 'Menyatakan Sebab dan Alasan', type: 'VIDEO' },
      { title: 'Quiz Pola Kalimat Penting', type: 'QUIZ' },
    ],
  },
  {
    title: 'Module 13 — Latihan Membaca (Dokkai)',
    lessons: [
      { title: 'Teknik Dasar Membaca Soal JLPT', type: 'VIDEO' },
      { title: 'Latihan Membaca 1', type: 'QUIZ' },
      { title: 'Latihan Membaca 2', type: 'QUIZ' },
      { title: 'Latihan Membaca 3', type: 'QUIZ' },
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
  gif: string;
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

function parseMateriWorkbook(workbook: ExcelJS.Workbook): MateriData {
  const kanjiSheet = workbook.getWorksheet('N5 - 漢字 (Kanji)');
  const kosakataSheet = workbook.getWorksheet('N5 - 語彙 (Kosakata)');
  const tataBahasaSheet = workbook.getWorksheet('N5 - 文法 (Tata Bahasa)');
  const quiz1Sheet = workbook.getWorksheet('N5 - Quiz 1');
  const quiz2Sheet = workbook.getWorksheet('N5 - Quiz 2');
  const placementSheet = workbook.getWorksheet('N5 - Placement Test');
  const tryoutSheet = workbook.getWorksheet('N5 - Try Out 1');

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
        mnemonik: cellVal(row.getCell(17)),
        gif: cellVal(row.getCell(16)),
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
  const dokkai = [...parseQuizSheet(placementSheet), ...parseQuizSheet(tryoutSheet)];

  return { kanji, kosakata, tataBahasa, quiz1, quiz2, dokkai };
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

const HIRAGANA_BASIC: Array<[string, string]> = [
  ['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o'],
  ['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko'],
  ['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so'],
  ['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to'],
  ['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no'],
  ['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho'],
  ['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo'],
  ['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo'],
  ['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro'],
  ['わ', 'wa'], ['を', 'wo'], ['ん', 'n'],
];

const HIRAGANA_DAKUON: Array<[string, string]> = [
  ['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go'],
  ['ざ', 'za'], ['じ', 'ji'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo'],
  ['だ', 'da'], ['ぢ', 'ji'], ['づ', 'zu'], ['で', 'de'], ['ど', 'do'],
  ['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo'],
  ['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po'],
];

const HIRAGANA_YOON: Array<[string, string]> = [
  ['きゃ', 'kya'], ['きゅ', 'kyu'], ['きょ', 'kyo'],
  ['しゃ', 'sha'], ['しゅ', 'shu'], ['しょ', 'sho'],
  ['ちゃ', 'cha'], ['ちゅ', 'chu'], ['ちょ', 'cho'],
  ['にゃ', 'nya'], ['にゅ', 'nyu'], ['にょ', 'nyo'],
  ['ひゃ', 'hya'], ['ひゅ', 'hyu'], ['ひょ', 'hyo'],
  ['みゃ', 'mya'], ['みゅ', 'myu'], ['みょ', 'myo'],
  ['りゃ', 'rya'], ['りゅ', 'ryu'], ['りょ', 'ryo'],
  ['ぎゃ', 'gya'], ['ぎゅ', 'gyu'], ['ぎょ', 'gyo'],
  ['じゃ', 'ja'], ['じゅ', 'ju'], ['じょ', 'jo'],
  ['びゃ', 'bya'], ['びゅ', 'byu'], ['びょ', 'byo'],
  ['ぴゃ', 'pya'], ['ぴゅ', 'pyu'], ['ぴょ', 'pyo'],
];

function toKatakana(char: string): string {
  return char.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

function katakanaSet(entries: Array<[string, string]>): Array<[string, string]> {
  return entries.map(([hira, romaji]) => [toKatakana(hira), romaji]);
}

const LOANWORD_KATAKANA: Array<[string, string, string]> = [
  ['コーヒー', 'koohii', 'kopi'],
  ['パン', 'pan', 'roti'],
  ['バス', 'basu', 'bis'],
  ['テレビ', 'terebi', 'televisi'],
  ['レストラン', 'resutoran', 'restoran'],
  ['コンビニ', 'konbini', 'toko serba ada'],
  ['ホテル', 'hoteru', 'hotel'],
  ['ペン', 'pen', 'pulpen'],
  ['ノート', 'nooto', 'buku catatan'],
  ['カメラ', 'kamera', 'kamera'],
  ['パソコン', 'pasokon', 'komputer'],
  ['スマホ', 'sumaho', 'smartphone'],
  ['タクシー', 'takushii', 'taksi'],
  ['エレベーター', 'erebeetaa', 'lift'],
  ['ギター', 'gitaa', 'gitar'],
];

const GREETINGS: Array<[string, string, string]> = [
  ['おはようございます', 'ohayou gozaimasu', 'selamat pagi'],
  ['こんにちは', 'konnichiwa', 'selamat siang'],
  ['こんばんは', 'konbanwa', 'selamat malam'],
  ['ありがとうございます', 'arigatou gozaimasu', 'terima kasih'],
  ['すみません', 'sumimasen', 'maaf / permisi'],
  ['ごめんなさい', 'gomen nasai', 'maaf'],
  ['さようなら', 'sayounara', 'selamat tinggal'],
  ['おやすみなさい', 'oyasumi nasai', 'selamat tidur'],
  ['はじめまして', 'hajimemashite', 'senang berkenalan'],
  ['よろしくお願いします', 'yoroshiku onegaishimasu', 'mohon bantuannya'],
  ['いただきます', 'itadakimasu', 'selamat makan (sebelum makan)'],
  ['ごちそうさまでした', 'gochisousama deshita', 'terima kasih atas makanannya'],
];

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
    gif_kanji: row.gif,
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

function charFlashcards(
  lessonId: string,
  entries: Array<[string, string]>,
  category: string,
): Record<string, string | number>[] {
  return entries.map(([char, romaji]) => ({
    lesson_external_id: lessonId,
    track: 'KOSAKATA',
    kategori: category,
    huruf: char,
    furigana: char,
    romaji,
    arti: `bunyi ${romaji}`,
  }));
}

function loanwordFlashcards(lessonId: string): Record<string, string | number>[] {
  return LOANWORD_KATAKANA.map(([jp, romaji, arti]) => ({
    lesson_external_id: lessonId,
    track: 'KOSAKATA',
    kategori: 'Kata Serapan',
    huruf: jp,
    furigana: jp,
    romaji,
    arti,
  }));
}

function greetingFlashcards(lessonId: string): Record<string, string | number>[] {
  return GREETINGS.map(([jp, romaji, arti]) => ({
    lesson_external_id: lessonId,
    track: 'KOSAKATA',
    kategori: 'Ungkapan',
    huruf: jp,
    furigana: jp,
    romaji,
    arti,
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

function buildLessonRefs(): LessonRef[] {
  const refs: LessonRef[] = [];
  CURRICULUM.forEach((module, moduleIndex) => {
    const moduleId = `m${String(moduleIndex + 1).padStart(2, '0')}-${slugify(module.title.replace(/^Module \d+ — /, ''))}`;
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
    case 'Huruf Dasar Hiragana':
      return charFlashcards(lesson.lessonId, HIRAGANA_BASIC, 'Hiragana Dasar');
    case 'Huruf Dakuon dan Handakuon':
      return charFlashcards(lesson.lessonId, HIRAGANA_DAKUON, 'Hiragana Dakuon');
    case 'Huruf Kombinasi (Youon)':
      return charFlashcards(lesson.lessonId, HIRAGANA_YOON, 'Hiragana Youon');
    case 'Huruf Dasar Katakana':
      return charFlashcards(lesson.lessonId, katakanaSet(HIRAGANA_BASIC), 'Katakana Dasar');
    case 'Kata Serapan dalam Katakana':
      return loanwordFlashcards(lesson.lessonId);
    case 'Ungkapan Sehari-hari':
      return greetingFlashcards(lesson.lessonId);
    case 'Ringkasan Tata Bahasa':
      return tataBahasaFlashcards(
        lesson.lessonId,
        data.tataBahasa.filter((row) =>
          ['Kopula & Predikat Dasar', 'Kata Tunjuk', 'Partikel', 'Perubahan Kata Kerja Sopan', 'Bentuk 〜ない', 'Bentuk 〜た', 'Keberadaan'].includes(
            row.kategori,
          ),
        ),
      );
    case 'Flashcard Angka':
      return [
        ...kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Angka'])),
        ...kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Waktu']).slice(0, 5), 'Angka'),
      ];
    case 'Hari, Bulan, dan Tanggal':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Hari']), 'Hari');
    case 'Jam dan Waktu':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Waktu']), 'Waktu');
    case 'Anggota Keluarga':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Keluarga']), 'Keluarga');
    case 'Pekerjaan dan Profesi':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Profesi']), 'Profesi');
    case 'Hubungan Sosial':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Manusia/Gender']), 'Hubungan Sosial');
    case 'Bagian Rumah':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Barang']).slice(0, 25), 'Rumah');
    case 'Sekolah dan Kelas':
      return kosakataFlashcards(
        lesson.lessonId,
        filterKosakata(data, ['Tempat']).filter((row) =>
          /学校|教室|大学|勉強|先生|学生/.test(row.kosakata + row.arti),
        ),
        'Sekolah',
      );
    case 'Benda Sehari-hari':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Barang']), 'Benda');
    case 'Warna dan Bentuk':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Kata Sifat']), 'Warna & Bentuk');
    case 'Nama Makanan':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Makanan']), 'Makanan');
    case 'Nama Minuman':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Minuman']), 'Minuman');
    case 'Jenis Kendaraan':
      return kosakataFlashcards(
        lesson.lessonId,
        filterKosakata(data, ['Tempat', 'Barang']).filter((row) =>
          /車|電車|バス|飛行機|自転車|駅|mobil|kereta|bus|sepeda|pesawat/i.test(
            row.kosakata + row.arti + row.romaji,
          ),
        ),
        'Transportasi',
      );
    case 'Tempat Umum':
      return kosakataFlashcards(lesson.lessonId, filterKosakata(data, ['Tempat']), 'Tempat');
    case 'Kanji Angka':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Angka']));
    case 'Kanji Hari dan Waktu':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Hari', 'Waktu']));
    case 'Kanji Alam':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Alam & Cuaca']));
    case 'Kanji Orang dan Keluarga':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Manusia & Keluarga', 'Anggota Tubuh']));
    case 'Kanji Tempat':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Kata Benda, Tempat & Transportasi', 'Arah & Letak']));
    case 'Kanji Sekolah':
      return kanjiFlashcards(lesson.lessonId, filterKanji(data, ['Sekolah & Pendidikan']));
    default:
      if (lesson.moduleTitle.includes('Katakana') && lesson.title.includes('Dakuon')) {
        return charFlashcards(lesson.lessonId, katakanaSet(HIRAGANA_DAKUON), 'Katakana Dakuon');
      }
      if (lesson.moduleTitle.includes('Katakana') && lesson.title.includes('Youon')) {
        return charFlashcards(lesson.lessonId, katakanaSet(HIRAGANA_YOON), 'Katakana Youon');
      }
      return [];
  }
}

function assignQuizQuestions(lessons: LessonRef[], data: MateriData): Map<string, QuizRow[]> {
  const quizLessons = lessons.filter((lesson) => lesson.type === 'QUIZ');
  const pool = [...data.quiz1, ...data.quiz2];
  const dokkaiLessons = quizLessons.filter((lesson) => lesson.moduleTitle.includes('Dokkai'));
  const regularQuizLessons = quizLessons.filter((lesson) => !lesson.moduleTitle.includes('Dokkai'));

  const perLesson = Math.max(4, Math.floor(pool.length / regularQuizLessons.length));
  const assigned = new Map<string, QuizRow[]>();
  let cursor = 0;

  for (const lesson of regularQuizLessons) {
    assigned.set(lesson.lessonId, pool.slice(cursor, cursor + perLesson));
    cursor += perLesson;
  }

  const dokkaiPool = data.dokkai.length > 0 ? data.dokkai : pool.slice(-12);
  const dokkaiChunk = Math.max(3, Math.floor(dokkaiPool.length / dokkaiLessons.length));
  dokkaiLessons.forEach((lesson, index) => {
    const start = index * dokkaiChunk;
    assigned.set(lesson.lessonId, dokkaiPool.slice(start, start + dokkaiChunk));
  });

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
    module_external_id: `m${String(index + 1).padStart(2, '0')}-${slugify(module.title.replace(/^Module \d+ — /, ''))}`,
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
    'Workbook impor kursus JLPT N5 Kursus Lengkap — template resmi v1.',
    'Materi flashcard & kuis diambil dari docs/Materi LMS terbaru.xlsx.',
    'Video memakai placeholder YouTube — ganti URL setelah materi video tersedia.',
    'Unggah di /admin/kursus/import setelah pratinjau valid.',
  ]);

  addDataSheet(workbook, '1. Course', 'FF0F766E', 'Satu baris kursus.', COURSE_COLS, {
    course_external_id: COURSE_ID,
    judul: 'JLPT N5 Kursus Lengkap',
    deskripsi:
      'Kurikulum lengkap JLPT N5: hiragana, katakana, kosakata, tata bahasa, kanji, dan latihan membaca.',
    level: 'N5',
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
    huruf: 'あ',
    romaji: 'a',
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
    for (const error of preview.errors.slice(0, 10)) {
      console.log(`  - [${error.code ?? 'ERR'}] ${error.message}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
