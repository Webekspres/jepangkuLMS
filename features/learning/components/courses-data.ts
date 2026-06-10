import type { JlptAccent } from '@/features/marketing/components/landing-data';

export const COURSE_LEVELS = ['Semua', 'N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const COURSE_CATEGORIES = [
  'Semua',
  'Kosa Kata',
  'Tata Bahasa',
  'Kanji',
  'Listening',
  'Speaking',
] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

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
  tags: Exclude<CourseCategory, 'Semua'>[];
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
    desc: 'Dari nol sampai lulus N5! Hiragana, Katakana, 80 Kanji, tata bahasa dasar.',
    lessons: 42,
    duration: '18 jam',
    availability: 'tersedia',
    availabilityLabel: 'Modul awal tersedia',
    price: 'Gratis',
    thumb: 'https://images.unsplash.com/photo-1613817048356-ef14b4acc3a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'emerald',
    badge: '入門',
    tags: ['Kosa Kata', 'Tata Bahasa', 'Kanji'],
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
    availabilityLabel: 'Segera hadir',
    price: 'Rp 299K',
    thumb: 'https://images.unsplash.com/photo-1593839154339-377e24b3ba32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'blue',
    badge: '基礎',
    tags: ['Tata Bahasa'],
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
    availabilityLabel: 'Segera hadir',
    price: 'Rp 249K',
    thumb: 'https://images.unsplash.com/photo-1681317474675-494bd8e91d7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'amber',
    badge: '漢字',
    tags: ['Kanji'],
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
    availabilityLabel: 'Segera hadir',
    price: 'Rp 199K',
    thumb: 'https://images.unsplash.com/photo-1542052125323-e69ad37a47c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'blue',
    badge: '語彙',
    tags: ['Kosa Kata'],
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
    availabilityLabel: 'Segera hadir',
    price: 'Rp 449K',
    thumb: 'https://images.unsplash.com/photo-1670233449318-2ddb73e062e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'amber',
    badge: '中級',
    tags: ['Kosa Kata', 'Tata Bahasa', 'Kanji'],
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
    availabilityLabel: 'Segera hadir',
    price: 'Rp 279K',
    thumb: 'https://images.unsplash.com/photo-1595672410691-67ca64d681d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent: 'violet',
    badge: '会話',
    tags: ['Listening', 'Speaking'],
    featured: false,
  },
];
