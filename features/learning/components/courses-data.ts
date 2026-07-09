import type { CourseCategoryType } from '@prisma/client';
import type { JlptAccent } from '@/features/marketing/components/landing-data';

export const COURSE_LEVELS = ['Semua', 'N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

/** Filter UI label — maps to `CourseCategoryType` di database. */
export const COURSE_TYPE_FILTERS = [
  'Semua',
  'Kursus Utama',
  'Kursus Gratis',
  'Kursus Tambahan',
] as const;
export type CourseTypeFilter = (typeof COURSE_TYPE_FILTERS)[number];

export const COURSE_TYPE_FILTER_TO_ENUM: Record<
  Exclude<CourseTypeFilter, 'Semua'>,
  CourseCategoryType
> = {
  'Kursus Utama': 'KURSUS_UTAMA',
  'Kursus Gratis': 'KURSUS_GRATIS',
  'Kursus Tambahan': 'KURSUS_TAMBAHAN',
};

export function courseMatchesTypeFilter(
  categoryType: CourseCategoryType | undefined,
  filter: CourseTypeFilter,
  tags: string[] = [],
): boolean {
  if (filter === 'Semua') return true;
  if (categoryType) {
    return categoryType === COURSE_TYPE_FILTER_TO_ENUM[filter];
  }
  // Fallback untuk data cache lama — tags berisi label kategori dari DB
  return tags.includes(filter);
}

export type CourseAvailability = 'tersedia' | 'segera';

export type CatalogCourse = {
  slug: string;
  title: string;
  level: Exclude<CourseLevel, 'Semua'>;
  desc: string;
  lessons: number;
  duration: string;
  availability: CourseAvailability;
  availabilityLabel: string;
  price: string;
  thumb: string;
  accent: JlptAccent;
  badge: string;
  /** Label tampilan kategori kursus (Utama / Gratis / Tambahan). */
  tags: string[];
  categoryType: CourseCategoryType;
  featured: boolean;
};

export const LEVEL_ACCENT: Record<Exclude<CourseLevel, 'Semua'>, JlptAccent> = {
  N5: 'emerald',
  N4: 'blue',
  N3: 'amber',
  N2: 'violet',
  N1: 'brand',
};

export const CATALOG_COURSES: CatalogCourse[] = [
  {
    slug: 'jlpt-n5-kursus-lengkap',
    title: 'JLPT N5 — Kursus Lengkap',
    level: 'N5',
    desc: 'Dari nol sampai lulus N5! Hiragana, Katakana, 100 Kanji, tata bahasa dasar, dan simulasi ujian.',
    lessons: 60,
    duration: '18 jam',
    availability: 'tersedia',
    availabilityLabel: 'Tersedia',
    price: 'Gratis',
    thumb: 'https://images.unsplash.com/photo-1613817048356-ef14b4acc3a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'emerald',
    badge: '入門',
    tags: ['Kursus Utama'],
    categoryType: 'KURSUS_UTAMA',
    featured: true,
  },
  {
    slug: 'n4-tata-bahasa-intensif',
    title: 'N4 Tata Bahasa Intensif',
    level: 'N4',
    desc: 'Pola kalimat N4 lengkap: て-form, たい, から, まで, dan 40+ pola lainnya.',
    lessons: 35,
    duration: '14 jam',
    availability: 'segera',
    availabilityLabel: 'Segera',
    price: 'Rp 299K',
    thumb: 'https://images.unsplash.com/photo-1593839154339-377e24b3ba32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'blue',
    badge: '基礎',
    tags: ['Kursus Tambahan'],
    categoryType: 'KURSUS_TAMBAHAN',
    featured: true,
  },
  {
    slug: 'kanji-n5-n4-master',
    title: 'Kanji N5 & N4 Master',
    level: 'N4',
    desc: 'Hafalkan 380 kanji N5+N4 dengan metode visual mnemonik yang efektif.',
    lessons: 28,
    duration: '12 jam',
    availability: 'segera',
    availabilityLabel: 'Segera',
    price: 'Rp 249K',
    thumb: 'https://images.unsplash.com/photo-1681317474675-494bd8e91d7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'amber',
    badge: '漢字',
    tags: ['Kursus Tambahan'],
    categoryType: 'KURSUS_TAMBAHAN',
    featured: false,
  },
  {
    slug: 'kosakata-n4-1500-kata',
    title: 'Kosakata N4 — 1500 Kata',
    level: 'N4',
    desc: 'Pelajari 1500 kosakata N4 dengan flashcard interaktif dan konteks kalimat nyata.',
    lessons: 30,
    duration: '10 jam',
    availability: 'segera',
    availabilityLabel: 'Segera',
    price: 'Rp 199K',
    thumb: 'https://images.unsplash.com/photo-1542052125323-e69ad37a47c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'blue',
    badge: '語彙',
    tags: ['Kursus Gratis'],
    categoryType: 'KURSUS_GRATIS',
    featured: false,
  },
  {
    slug: 'jlpt-n3-kursus-menengah',
    title: 'JLPT N3 — Kursus Menengah',
    level: 'N3',
    desc: 'Kuasai N3 dengan 650 kanji, tata bahasa kompleks, dan reading comprehension.',
    lessons: 60,
    duration: '28 jam',
    availability: 'segera',
    availabilityLabel: 'Segera',
    price: 'Rp 449K',
    thumb: 'https://images.unsplash.com/photo-1670233449318-2ddb73e062e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'amber',
    badge: '中級',
    tags: ['Kursus Utama'],
    categoryType: 'KURSUS_UTAMA',
    featured: true,
  },
  {
    slug: 'japanese-speaking-listening-n4',
    title: 'Japanese Speaking & Listening N4',
    level: 'N4',
    desc: 'Latih percakapan natural dan listening skill dengan dialog audio native speaker.',
    lessons: 25,
    duration: '11 jam',
    availability: 'segera',
    availabilityLabel: 'Segera',
    price: 'Rp 279K',
    thumb: 'https://images.unsplash.com/photo-1595672410691-67ca64d681d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'violet',
    badge: '会話',
    tags: ['Kursus Tambahan'],
    categoryType: 'KURSUS_TAMBAHAN',
    featured: false,
  },
];
