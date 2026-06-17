import { ADMIN_WA_NUMBER } from '@/lib/admin-contact';
import { buildN5MarketingSyllabus } from '@/features/learning/lib/n5-lesson-modules';
import { CATALOG_COURSES, type CatalogCourse } from './courses-data';

export type CourseSyllabusItem = {
  title: string;
  duration: string;
  locked: boolean;
};

export type CourseSyllabusModule = {
  title: string;
  items: CourseSyllabusItem[];
};

export type CourseDetail = CatalogCourse & {
  fullDesc: string;
  whatYouLearn: string[];
  priceNum: number;
  syllabus: CourseSyllabusModule[];
  includes: string[];
};

export const PAYMENT_BCA = {
  bank: 'BCA',
  accountName: 'PT Jepangku Indonesia',
  accountNumber: '1234567890',
} as const;

export { ADMIN_WA_NUMBER };

type CourseDetailExtras = Omit<CourseDetail, keyof CatalogCourse>;

const COURSE_DETAIL_EXTRAS: Record<string, CourseDetailExtras> = {
  'jlpt-n5-kursus-lengkap': {
    fullDesc:
      'Kursus paling komprehensif untuk pemula absolut. Mulai dari mengenal aksara Hiragana dan Katakana, kemudian 80 kanji N5, pola tata bahasa dasar, hingga latihan soal bergaya JLPT N5.',
    whatYouLearn: [
      'Membaca dan menulis Hiragana & Katakana',
      '80 Kanji dasar N5',
      'Pola tata bahasa N5 (50+ pola)',
      'Kosakata N5 (800 kata)',
      'Strategi ujian JLPT N5',
    ],
    priceNum: 0,
    includes: [
      'Akses modul N5 yang sudah rilis',
      'Video pelajaran terstruktur',
      'Quiz interaktif per bab',
      'Progress tracking setelah login',
      'Update materi gratis',
    ],
    syllabus: buildN5MarketingSyllabus(),
  },
  'n4-tata-bahasa-intensif': {
    fullDesc:
      'Fokus penuh pada penguasaan tata bahasa JLPT N4. Setiap pola dijelaskan dengan contoh nyata, latihan kontekstual, dan drill soal bergaya JLPT.',
    whatYouLearn: [
      '40+ pola tata bahasa N4',
      'Penggunaan て-form secara mendalam',
      'Tata bahasa kondisional (たら/ば/と/なら)',
      'Latihan soal bergaya JLPT',
      'Review lengkap tata bahasa N5',
    ],
    priceNum: 299_000,
    includes: [
      'Akses seumur hidup setelah rilis',
      '35 video pelajaran',
      'Drill soal per pola',
      'Materi dapat diunduh',
      'Dukungan instruktur via WA',
    ],
    syllabus: [
      {
        title: 'Modul 1 — て-form & Variasi',
        items: [
          { title: 'Pengenalan て-form', duration: '16 menit', locked: false },
          { title: 'て-form untuk permintaan', duration: '14 menit', locked: true },
          { title: 'て-form beruntun', duration: '18 menit', locked: true },
        ],
      },
      {
        title: 'Modul 2 — Pola N4 Lanjutan',
        items: [
          { title: 'たい & たがる', duration: '15 menit', locked: true },
          { title: 'から & まで', duration: '12 menit', locked: true },
          { title: 'Simulasi soal N4', duration: '35 menit', locked: true },
        ],
      },
    ],
  },
  'kanji-n5-n4-master': {
    fullDesc:
      'Metode mnemonik visual untuk menghafal 380 kanji N5+N4. Dilengkapi flashcard interaktif dan latihan menulis.',
    whatYouLearn: [
      '80 kanji N5 + 300 kanji N4',
      'Teknik mnemonik visual',
      "Cara baca On'yomi & Kun'yomi",
      'Kanji dalam konteks kalimat nyata',
      'Latihan menulis kanji',
    ],
    priceNum: 249_000,
    includes: [
      'Akses seumur hidup setelah rilis',
      '28 video pelajaran',
      'Flashcard interaktif',
      'Latihan menulis',
      'Update kanji gratis',
    ],
    syllabus: [
      {
        title: 'Modul 1 — Kanji N5',
        items: [
          { title: 'Kanji dasar & angka', duration: '20 menit', locked: false },
          { title: 'Kanji alam & tempat', duration: '22 menit', locked: true },
        ],
      },
      {
        title: 'Modul 2 — Kanji N4',
        items: [
          { title: 'Kanji emosi & tindakan', duration: '25 menit', locked: true },
          { title: 'Review mnemonik', duration: '30 menit', locked: true },
        ],
      },
    ],
  },
  'kosakata-n4-1500-kata': {
    fullDesc:
      'Pelajari 1500 kosakata JLPT N4 dengan sistem SRS, dilengkapi kalimat contoh dan latihan soal kosakata.',
    whatYouLearn: [
      '1500 kosakata N4 lengkap',
      'Konteks kalimat native speaker',
      'Pengelompokan berdasarkan tema',
      'Latihan soal kosakata JLPT',
      'Teknik hafalan SRS',
    ],
    priceNum: 199_000,
    includes: [
      'Akses seumur hidup setelah rilis',
      '30 video pelajaran',
      'Flashcard SRS',
      'Quiz per tema',
      'Materi unduhan',
    ],
    syllabus: [
      {
        title: 'Modul 1 — Kosakata Tematik',
        items: [
          { title: 'Kosakata sehari-hari', duration: '18 menit', locked: false },
          { title: 'Kosakata pekerjaan', duration: '16 menit', locked: true },
          { title: 'Kosakata abstrak', duration: '20 menit', locked: true },
        ],
      },
    ],
  },
  'jlpt-n3-kursus-menengah': {
    fullDesc:
      'Paket lengkap N3: 650 kanji, 200+ pola tata bahasa, kosakata N3, serta latihan dokkai dan choukai intensif.',
    whatYouLearn: [
      '650 kanji N3',
      '200+ pola tata bahasa N3',
      '3000+ kosakata N3',
      'Strategi dokkai & choukai',
      'Simulasi ujian JLPT N3',
    ],
    priceNum: 449_000,
    includes: [
      'Akses seumur hidup setelah rilis',
      '60 video pelajaran',
      'Simulasi ujian',
      'Materi unduhan',
      'Sertifikat penyelesaian',
    ],
    syllabus: [
      {
        title: 'Modul 1 — Kanji & Kosakata N3',
        items: [
          { title: 'Kanji N3 dasar', duration: '25 menit', locked: false },
          { title: 'Kosakata tematik N3', duration: '22 menit', locked: true },
        ],
      },
      {
        title: 'Modul 2 — Reading & Listening',
        items: [
          { title: 'Strategi dokkai N3', duration: '30 menit', locked: true },
          { title: 'Latihan choukai N3', duration: '28 menit', locked: true },
        ],
      },
    ],
  },
  'japanese-speaking-listening-n4': {
    fullDesc:
      'Tingkatkan speaking dan listening ke level N4 dengan dialog audio native speaker, latihan shadowing, dan simulasi percakapan.',
    whatYouLearn: [
      '300+ dialog audio native speaker',
      'Teknik shadowing efektif',
      'Percakapan sehari-hari N4',
      'Latihan choukai bergaya JLPT',
      'Pola kalimat spoken Japanese',
    ],
    priceNum: 279_000,
    includes: [
      'Akses seumur hidup setelah rilis',
      '25 video pelajaran',
      'Audio dialog native',
      'Latihan shadowing',
      'Dukungan instruktur via WA',
    ],
    syllabus: [
      {
        title: 'Modul 1 — Dialog Sehari-hari',
        items: [
          { title: 'Perkenalan diri', duration: '14 menit', locked: false },
          { title: 'Belanja & restoran', duration: '18 menit', locked: true },
          { title: 'Shadowing practice', duration: '20 menit', locked: true },
        ],
      },
    ],
  },
};

export function getCourseBySlug(slug: string): CourseDetail | undefined {
  const base = CATALOG_COURSES.find((c) => c.slug === slug);
  const extra = COURSE_DETAIL_EXTRAS[slug];
  if (!base || !extra) return undefined;
  return { ...base, ...extra };
}

export function getAllCourseSlugs(): string[] {
  return CATALOG_COURSES.map((c) => c.slug);
}
