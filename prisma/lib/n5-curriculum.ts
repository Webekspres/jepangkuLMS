/**
 * Kurikulum N5 — Phase 1 LMS (satu kursus published).
 * Selaras dengan sheet Excel `Materi LMS JepangKu - Nihongo.xlsx` dan modul di proposal Phase 01.
 */

export type N5Module =
  | 'aksara'
  | 'kanji'
  | 'kosakata'
  | 'tata-bahasa'
  | 'kuis'
  | 'tryout';

export type N5LessonDef = {
  slug: string;
  title: string;
  order: number;
  content: string;
  videoUrl?: string;
  module: N5Module;
  /** Nama kolom Kategori di Excel — untuk routing impor materi */
  excelCategory?: string;
};

/** Kategori persis seperti di sheet Excel */
export const N5_KANJI_CATEGORIES = [
  'Angka',
  'Hari',
  'Waktu',
  'Manusia & Keluarga',
  'Anggota Tubuh',
  'Sekolah & Pendidikan',
  'Kata Sifat',
  'Arah & Letak',
  'Alam & Cuaca',
  'Kata Kerja / Aktivitas',
  'Kata Benda, Tempat & Transportasi',
] as const;

export const N5_KOSAKATA_CATEGORIES = [
  'Makanan',
  'Minuman',
  'Hari',
  'Waktu',
  'Manusia/Gender',
  'Profesi',
  'Keluarga',
  'Bagian Tubuh',
  'Tempat',
  'Alam',
  'Pakaian',
  'Barang',
  'Letak / Posisi',
  'Hewan',
  'Hobi',
  'Bahasa',
  'Penyakit',
  'Benda',
  'Kata Kerja',
  'Kata Sifat',
] as const;

export const N5_TATA_BAHASA_CATEGORIES = [
  'Kopula & Predikat Dasar',
  'Kata Tunjuk',
  'Partikel',
  'Perubahan Kata Sifat',
  'Perubahan Kata Kerja Sopan',
  'Bentuk 〜て',
  'Bentuk 〜ない',
  'Bentuk 〜た',
  'Keberadaan',
  'Keinginan',
  'Perpindahan',
  'Perubahan',
  'Perbandingan',
  'Kesukaan',
  'Kemampuan',
  'Pemahaman',
  'Kata Sambung',
  'Sebab-Akibat/Alasan',
  'Keterangan',
] as const;

export function slugifyCategory(name: string): string {
  return name
    .replace(/〜て/g, '-te')
    .replace(/〜ない/g, '-nai')
    .replace(/〜た/g, '-ta')
    .replace(/&/g, 'dan')
    .replace(/\//g, '-')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function categoryLessonSlug(
  track: 'kanji' | 'kosakata' | 'tata-bahasa',
  categoryName: string,
): string {
  return `${track}-n5-${slugifyCategory(categoryName)}`;
}

const AKSARA_LESSONS: N5LessonDef[] = [
  {
    slug: 'pengenalan-aksara-jepang',
    title: 'Pengenalan aksara Jepang',
    order: 1,
    module: 'aksara',
    content:
      'Mengenal tiga sistem aksara Jepang: Hiragana (あ), Katakana (ア), dan Kanji (漢字). Hiragana untuk kata asli Jepang, Katakana untuk kata serapan, Kanji untuk makna inti.',
  },
  {
    slug: 'hiragana-a-ta',
    title: 'Hiragana baris あ–た',
    order: 2,
    module: 'aksara',
    content:
      'Belajar menulis dan membaca 25 karakter Hiragana dasar dari baris あ (a) hingga た (ta). Latihan dengan flashcard dan pengucapan romaji.',
  },
  {
    slug: 'hiragana-na-n',
    title: 'Hiragana baris な–ん',
    order: 3,
    module: 'aksara',
    content:
      'Menyelesaikan Gojūon Hiragana: baris な (na) hingga ん (n). Setelah modul ini kamu bisa membaca semua suku kata Hiragana dasar.',
  },
  {
    slug: 'hiragana-dakuten-handakuten',
    title: 'Hiragana dakuten & handakuten',
    order: 4,
    module: 'aksara',
    content:
      'Variasi bunyi dengan ゛ (dakuten) dan ゜ (handakuten): がぎぐげご, ぱぴぷぺぽ, dan kombinasi きゃ・しゅ・ちょ (yōon).',
  },
  {
    slug: 'katakana-lengkap',
    title: 'Katakana Gojūon',
    order: 5,
    module: 'aksara',
    content:
      'Membaca dan menulis Katakana untuk kata serapan, nama asing, dan onomatope. Struktur sama dengan Hiragana, bentuk visual berbeda.',
  },
  {
    slug: 'katakana-dakuten-yoon',
    title: 'Katakana dakuten & yōon',
    order: 6,
    module: 'aksara',
    content:
      'Katakana dengan dakuten/handakuten dan suku kata gabungan (キャ, シュ, トゥ). Penting untuk membaca menu, teknologi, dan nama brand.',
  },
];

function categoryLessons(
  track: 'kanji' | 'kosakata' | 'tata-bahasa',
  categories: readonly string[],
  startOrder: number,
  label: string,
): N5LessonDef[] {
  return categories.map((category, index) => {
    const slug = categoryLessonSlug(track, category);
    const lessonModule =
      track === 'kanji' ? 'kanji' : track === 'kosakata' ? 'kosakata' : 'tata-bahasa';
    return {
      slug,
      title: `${label}: ${category}`,
      order: startOrder + index,
      module: lessonModule,
      excelCategory: category,
      content: `Materi ${label.toLowerCase()} JLPT N5 — topik **${category}**. Gunakan tab Flashcard untuk hafalan dan tab Quiz setelah modul terkait selesai.`,
    };
  });
}

const KANJI_LESSONS = categoryLessons('kanji', N5_KANJI_CATEGORIES, 7, 'Kanji N5');
const KOSAKATA_LESSONS = categoryLessons(
  'kosakata',
  N5_KOSAKATA_CATEGORIES,
  7 + N5_KANJI_CATEGORIES.length,
  'Kosakata N5',
);
const TATA_BAHASA_LESSONS = categoryLessons(
  'tata-bahasa',
  N5_TATA_BAHASA_CATEGORIES,
  7 + N5_KANJI_CATEGORIES.length + N5_KOSAKATA_CATEGORIES.length,
  'Tata Bahasa N5',
);

const EVALUASI_LESSONS: N5LessonDef[] = [
  {
    slug: 'kuis-n5-1',
    title: 'Kuis N5 — Set 1',
    order: 7 + N5_KANJI_CATEGORIES.length + N5_KOSAKATA_CATEGORIES.length + N5_TATA_BAHASA_CATEGORIES.length,
    module: 'kuis',
    content: 'Latihan pilihan ganda kanji, kosakata, dan tata bahasa N5 (60 soal — set 1).',
  },
  {
    slug: 'kuis-n5-2',
    title: 'Kuis N5 — Set 2',
    order: 8 + N5_KANJI_CATEGORIES.length + N5_KOSAKATA_CATEGORIES.length + N5_TATA_BAHASA_CATEGORIES.length,
    module: 'kuis',
    content: 'Latihan lanjutan N5 (60 soal — set 2). Ulangi modul materi jika skor di bawah 70%.',
  },
  {
    slug: 'tryout-n5-placement',
    title: 'Placement Test N5',
    order: 9 + N5_KANJI_CATEGORIES.length + N5_KOSAKATA_CATEGORIES.length + N5_TATA_BAHASA_CATEGORIES.length,
    module: 'tryout',
    content:
      'Tes penempatan awal untuk mengukur level N5-mu sebelum memulai kurikulum. Soal diambil dari bank Placement Test (34 soal).',
  },
  {
    slug: 'tryout-n5-simulasi-1',
    title: 'Try Out JLPT N5 — Simulasi 1',
    order: 10 + N5_KANJI_CATEGORIES.length + N5_KOSAKATA_CATEGORIES.length + N5_TATA_BAHASA_CATEGORIES.length,
    module: 'tryout',
    content:
      'Simulasi ujian JLPT N5 dengan 60 soal pilihan ganda. Kerjakan dalam mode fokus; skor dan analisis tersimpan di profil belajar.',
  },
];

/** Lesson slug lama yang diganti struktur per-kategori */
export const N5_OBSOLETE_LESSON_SLUGS = ['kanji-n5', 'kosakata-n5', 'tata-bahasa-n5'] as const;

export const N5_ALL_LESSONS: N5LessonDef[] = [
  ...AKSARA_LESSONS,
  ...KANJI_LESSONS,
  ...KOSAKATA_LESSONS,
  ...TATA_BAHASA_LESSONS,
  ...EVALUASI_LESSONS,
];

export const N5_LESSON_COUNT = N5_ALL_LESSONS.length;
