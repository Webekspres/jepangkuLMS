import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Calendar,
  Compass,
  Layers,
  Rocket,
  Target,
  Trophy,
  Video,
  Wifi,
  Zap,
} from 'lucide-react';

/** Locale tetap agar SSR & client tidak mismatch (hydration). */
export function formatDisplayNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export const LANDING_SEIGAIHA = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><circle cx='30' cy='40' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/><circle cx='0' cy='40' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/><circle cx='60' cy='40' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/><circle cx='15' cy='14' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/><circle cx='45' cy='14' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/></svg>`;

/** Grid halus hero terang (Updraft-style). */
export const LANDING_HERO_GRID_STYLE = {
  backgroundImage: [
    'linear-gradient(to right, color-mix(in srgb, var(--foreground) 7%, transparent) 1px, transparent 1px)',
    'linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 7%, transparent) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '48px 48px',
} as const;

/** Grid di atas pita gradien warna di dasar hero. */
export const LANDING_HERO_COLOR_BAND_GRID_STYLE = {
  backgroundImage: [
    'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px)',
    'linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '48px 48px',
} as const;

/** Gradien pastel lembut di dasar hero — tidak terlalu mencolok. */
export const LANDING_HERO_COLOR_BAND_GRADIENT =
  'linear-gradient(to right, color-mix(in srgb, #7dd3fc 32%, transparent), color-mix(in srgb, #f9a8d4 26%, transparent) 35%, color-mix(in srgb, #fde68a 24%, transparent) 65%, color-mix(in srgb, #86efac 30%, transparent))';

export const HERO_TRUST_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export const HERO_MOCK_MODULES = [
  { title: 'Hiragana & Katakana', active: true },
  { title: 'Kanji Dasar N5', active: false },
  { title: 'Tata Bahasa N5', active: false },
  { title: 'Kuis & Try Out', active: false },
] as const;

export type JlptLevelStatus = 'tersedia' | 'segera';

export const JLPT_LEVELS = [
  {
    level: 'N5',
    label: 'Pemula',
    desc: 'Hiragana, Katakana & Kanji dasar (80 kanji)',
    badge: '入門',
    accent: 'emerald',
    modules: 12,
    status: 'tersedia' as JlptLevelStatus,
    statusLabel: 'Modul awal tersedia',
  },
  {
    level: 'N4',
    label: 'Dasar',
    desc: 'Tata bahasa & 300 kosakata baru (300 kanji)',
    badge: '基礎',
    accent: 'blue',
    modules: 10,
    status: 'segera' as JlptLevelStatus,
    statusLabel: 'Segera hadir',
  },
  {
    level: 'N3',
    label: 'Menengah',
    desc: 'Percakapan kompleks & 650 kanji',
    badge: '中級',
    accent: 'amber',
    modules: 14,
    status: 'segera' as JlptLevelStatus,
    statusLabel: 'Segera hadir',
  },
  {
    level: 'N2',
    label: 'Lanjutan',
    desc: 'Teks formal & 1000 kanji',
    badge: '上級',
    accent: 'violet',
    modules: 16,
    status: 'segera' as JlptLevelStatus,
    statusLabel: 'Segera hadir',
  },
  {
    level: 'N1',
    label: 'Mahir',
    desc: 'Bahasa Jepang native & 2000 kanji',
    badge: '上達',
    accent: 'brand',
    modules: 18,
    status: 'segera' as JlptLevelStatus,
    statusLabel: 'Segera hadir',
  },
] as const;

export type JlptAccent = (typeof JLPT_LEVELS)[number]['accent'];

export const JLPT_ACCENT: Record<
  JlptAccent,
  { border: string; bg: string; text: string; bar: string; badge: string }
> = {
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500',
  },
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/15',
    text: 'text-blue-600',
    bar: 'bg-blue-500',
    badge: 'bg-blue-500',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/15',
    text: 'text-amber-600',
    bar: 'bg-amber-500',
    badge: 'bg-amber-500',
  },
  violet: {
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/15',
    text: 'text-violet-600',
    bar: 'bg-violet-500',
    badge: 'bg-violet-500',
  },
  brand: {
    border: 'border-primary/30',
    bg: 'bg-primary/15',
    text: 'text-primary',
    bar: 'bg-primary',
    badge: 'bg-primary',
  },
};

export const LANDING_FEATURES: {
  icon: LucideIcon;
  title: string;
  desc: string;
  tag: string;
  gradient: string;
  /** Warna blob dekorasi sudut kanan atas card (opacity rendah). */
  blobColor: string;
  href: string;
}[] = [
  {
    icon: Video,
    title: 'Video On Demand',
    desc: 'Video lesson terstruktur per modul JLPT dengan subtitle Jepang–Indonesia.',
    tag: 'VOD',
    gradient: 'from-brand-red to-brand-orange',
    blobColor: 'bg-brand-red',
    href: '/kursus',
  },
  {
    icon: BookOpen,
    title: 'JLPT Try Out Center',
    desc: 'Simulasi ujian JLPT untuk mengukur kesiapanmu sebelum ujian resmi.',
    tag: 'JLPT',
    gradient: 'from-secondary to-brand-navy',
    blobColor: 'bg-brand-navy',
    href: '/tryout',
  },
  {
    icon: Trophy,
    title: 'Gamifikasi XP & Badge',
    desc: 'Kumpulkan XP dari kuis & materi, raih badge, dan pantau progres belajarmu.',
    tag: 'GAME',
    gradient: 'from-amber-500 to-brand-yellow',
    blobColor: 'bg-amber-500',
    href: '/leaderboard',
  },
  {
    icon: Wifi,
    title: 'Live Class via Zoom',
    desc: 'Sesi live interaktif bersama sensei — tanya jawab langsung, real-time.',
    tag: 'LIVE',
    gradient: 'from-emerald-500 to-emerald-600',
    blobColor: 'bg-emerald-500',
    href: '/kursus',
  },
];

/** Pilar platform — faktual, tanpa angka sosial palsu. */
export const LANDING_PILLARS: {
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    icon: Layers,
    title: '5 Level JLPT',
    desc: 'Kurikulum terstruktur dari N5 pemula hingga N1 mahir.',
  },
  {
    icon: Target,
    title: 'Fokus MVP N5',
    desc: 'Peluncuran awal dimulai dari modul N5 — level lain menyusul bertahap.',
  },
  {
    icon: Compass,
    title: 'Satu Platform',
    desc: 'Video, kuis, try out, dan gamifikasi dalam satu ekosistem belajar.',
  },
  {
    icon: Calendar,
    title: 'Roadmap 2026',
    desc: 'Konten dan fitur dikembangkan transparan sepanjang tahun ini.',
  },
];

/** Menggantikan testimoni palsu — manfaat & persona target yang jujur. */
export const LANDING_VALUE_PROPS: {
  title: string;
  persona: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    title: 'Pemula dari Nol',
    persona: 'Untuk yang baru kenal Hiragana',
    desc: 'Mulai dari dasar dengan modul N5 yang terstruktur — tanpa perlu pengalaman sebelumnya.',
    icon: Rocket,
  },
  {
    title: 'Pejuang JLPT',
    persona: 'Untuk yang target lulus ujian',
    desc: 'Try out dan kuis membantu kamu terbiasa dengan format soal dan ritme ujian resmi.',
    icon: Target,
  },
  {
    title: 'Belajar Konsisten',
    persona: 'Untuk yang butuh motivasi',
    desc: 'XP, badge, dan progress tracker dirancang agar belajar terasa seperti sebuah perjalanan.',
    icon: Zap,
  },
];

export const FLOATING_KANJI = ['日', '本', '語', '学', '習', '漢', '字', '文'] as const;

export const PRICING_PLANS = [
  {
    name: 'N5 Starter',
    price: 'Rp 299.000',
    period: '/bulan',
    description: 'Cocok untuk pemula yang baru mulai perjalanan JLPT.',
    features: ['Akses video N5', 'Try out bulanan', 'XP & badge dasar'],
    highlighted: false,
  },
  {
    name: 'N3 Intensif',
    price: 'Rp 599.000',
    period: '/bulan',
    description: 'Paket untuk siswa yang serius naik level — konsultasi via admin.',
    features: ['Semua level hingga N3', 'Live class berkala', 'Analitik skor JLPT'],
    highlighted: true,
  },
  {
    name: 'N1 Master',
    price: 'Konsultasi',
    period: '',
    description: 'Program premium menuju N1 — hubungi tim untuk rencana khusus.',
    features: ['Mentoring 1-on-1', 'Materi & try out N1', 'Prioritas support admin'],
    highlighted: false,
  },
] as const;
