export type N4Module =
    | 'kanji'
    | 'kosakata'
    | 'tata-bahasa'
    | 'kuis'
    | 'tryout';

export type N4LessonDef = {
    slug: string;
    title: string;
    order: number;
    content: string;
    module: N4Module;
    excelCategory?: string;
};

export const N4_KANJI_CATEGORIES = [
    'Alam',
    'Alam & Cuaca',
    'Alam & Musim',
    'Alam & Tempat',
    'Angka & Konsep',
    'Arah',
    'Benda',
    'Fisik',
    'Hewan',
    'Kata Kerja',
    'Keluarga',
    'Konsep',
    'Makanan',
    'Makanan & Hewan',
    'Sifat',
    'Sifat & Makanan',
    'Tempat',
    'Waktu',
    'Waktu & Sifat',
] as const;

export const N4_KOSAKATA_CATEGORIES = [
    'Abstrak',
    'Aktivitas Fisik',
    'Alam',
    'Benda',
    'Choukai (Sering Keluar)',
    'Choukai/Dokkai',
    'Dokkai (Kata Kerja)',
    'Dokkai (Kata Sifat)',
    'Emosi',
    'Kata Hubung',
    'Kata Penunjuk',
    'Kata Sifat (Fisik)',
    'Kata Sifat (Perasaan/Karakter)',
    'Kata Sifat (Situasi/Kondisi)',
    'Keadaan',
    'Keadaan (Intrans)',
    'Keadaan (Trans)',
    'Kegiatan',
    'Keigo (Hormat)',
    'Keigo (Rendah)',
    'Kejadian',
    'Keterangan (Harapan)',
    'Keterangan (Kepastian)',
    'Keterangan (Tingkat/Derajat)',
    'Keterangan (Waktu)',
    'Keterangan (Waktu/Hasil)',
    'Kognitif',
    'Komunikasi',
    'Kondisi',
    'Konsep',
    'Kuantitas/Batas',
    'Objek',
    'Sosial',
    'Tempat',
    'Ungkapan Harian',
] as const;

export const N4_TATA_BAHASA_CATEGORIES = [
    'Alasan Paralel',
    'Bahasa Hormat (Keigo)',
    'Bahasa Merendah (Keigo)',
    'Bentuk Suara',
    'Bentuk Te (Kondisi)',
    'Dugaan & Kemungkinan',
    'Durasi Waktu',
    'Harapan & Penyesalan',
    'Jadwal',
    'Keputusan',
    'Ketidakpastian',
    'Klausa Pertanyaan',
    'Kondisi (Tetap)',
    'Kondisional (Pengandaian)',
    'Niat & Rencana',
    'Pemberian/Penerimaan',
    'Pengalaman / Kebiasaan',
    'Pengantar Alasan',
    'Perasaan (Syukur)',
    'Perasaan Orang Ketiga',
    'Perbandingan',
    'Perintah & Saran',
    'Permintaan Sopan',
    'Pertentangan',
    'Perubahan & Usaha',
    'Saran & Nasihat',
    'Sufiks Kata Kerja',
    'Titik Waktu',
    'Tujuan & Alasan',
    'Tujuan (Kegunaan)',
    'Waktu Kejadian',
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
    return `${track}-n4-${slugifyCategory(categoryName)}`;
}

function categoryLessons(
    track: 'kanji' | 'kosakata' | 'tata-bahasa',
    categories: readonly string[],
    startOrder: number,
    label: string,
): N4LessonDef[] {
    return categories.map((category, index) => ({
        slug: categoryLessonSlug(track, category),
        title: `${label}: ${category}`,
        order: startOrder + index,
        module: track,
        excelCategory: category,
        content: `Materi ${label.toLowerCase()} JLPT N4 — topik **${category}**.`,
    }));
}

const KANJI_LESSONS = categoryLessons('kanji', N4_KANJI_CATEGORIES, 1, 'Kanji N4');
const KOSAKATA_LESSONS = categoryLessons(
    'kosakata',
    N4_KOSAKATA_CATEGORIES,
    1 + N4_KANJI_CATEGORIES.length,
    'Kosakata N4',
);
const TATA_BAHASA_LESSONS = categoryLessons(
    'tata-bahasa',
    N4_TATA_BAHASA_CATEGORIES,
    1 + N4_KANJI_CATEGORIES.length + N4_KOSAKATA_CATEGORIES.length,
    'Tata Bahasa N4',
);

const EVALUASI_LESSONS: N4LessonDef[] = [
    {
        slug: 'kuis-n4-1',
        title: 'Kuis N4 — Set 1',
        order: 1 + N4_KANJI_CATEGORIES.length + N4_KOSAKATA_CATEGORIES.length + N4_TATA_BAHASA_CATEGORIES.length,
        module: 'kuis',
        content: 'Latihan pilihan ganda N4 (set 1).',
    },
    {
        slug: 'kuis-n4-2',
        title: 'Kuis N4 — Set 2',
        order: 2 + N4_KANJI_CATEGORIES.length + N4_KOSAKATA_CATEGORIES.length + N4_TATA_BAHASA_CATEGORIES.length,
        module: 'kuis',
        content: 'Latihan pilihan ganda N4 (set 2).',
    },
    {
        slug: 'tryout-n4-simulasi-1',
        title: 'Try Out JLPT N4 — Simulasi 1',
        order: 3 + N4_KANJI_CATEGORIES.length + N4_KOSAKATA_CATEGORIES.length + N4_TATA_BAHASA_CATEGORIES.length,
        module: 'tryout',
        content: 'Simulasi ujian JLPT N4 berbasis soal workbook sensei.',
    },
];

export const N4_OBSOLETE_LESSON_SLUGS = ['kanji-n4', 'kosakata-n4', 'tata-bahasa-n4'] as const;

export const N4_ALL_LESSONS: N4LessonDef[] = [
    ...KANJI_LESSONS,
    ...KOSAKATA_LESSONS,
    ...TATA_BAHASA_LESSONS,
    ...EVALUASI_LESSONS,
];

