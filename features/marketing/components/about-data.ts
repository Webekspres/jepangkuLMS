import type { LucideIcon } from 'lucide-react';
import { BookOpen, Gamepad2, GraduationCap, LineChart } from 'lucide-react';

/** Konten placeholder — ganti saat copy final dari tim JepangKu tersedia. */
export const ABOUT_HERO = {
  badge: '私たちについて',
  title: 'Tentang JepangKu LMS',
  subtitle:
    'Platform belajar bahasa Jepang terstruktur JLPT dengan gamifikasi — bagian dari ekosistem JepangKu.',
} as const;

export const ABOUT_VISION = {
  title: 'Visi',
  /** Placeholder */
  body: '[Visi JepangKu LMS akan diisi di sini. Contoh: menjadi platform belajar bahasa Jepang terdepan yang terjangkau dan menyenangkan bagi pelajar Indonesia.]',
} as const;

export const ABOUT_MISSION = {
  title: 'Misi',
  items: [
    '[Misi 1 — menyediakan kurikulum JLPT terstruktur dari N5 hingga N1.]',
    '[Misi 2 — menghadirkan pengalaman belajar interaktif dengan gamifikasi XP & badge.]',
    '[Misi 3 — mendukung persiapan ujian melalui kuis dan try out.]',
  ],
} as const;

export const ABOUT_PILLARS: {
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    icon: BookOpen,
    title: 'Kurikulum JLPT',
    desc: 'Materi disusun mengikuti level resmi N5–N1, bukan konten acak.',
  },
  {
    icon: Gamepad2,
    title: 'Gamifikasi',
    desc: 'XP, badge, dan progress tracker agar belajar terasa seperti perjalanan.',
  },
  {
    icon: GraduationCap,
    title: 'Try Out & Kuis',
    desc: 'Latihan soal dan simulasi untuk mengukur kesiapan sebelum ujian resmi.',
  },
  {
    icon: LineChart,
    title: 'Progress Transparan',
    desc: 'Siswa bisa melihat perkembangan belajar dan riwayat attempt.',
  },
];

/** Faktual untuk brand baru — bukan statistik sosial palsu. */
export const ABOUT_FACTS = [
  { label: 'Peluncuran', value: '2026' },
  { label: 'Level JLPT', value: 'N5–N1' },
  { label: 'Fokus MVP', value: 'N5' },
  { label: 'Ekosistem', value: 'LMS + Portal' },
] as const;

export type AboutTeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
  accent: 'primary' | 'blue' | 'amber' | 'emerald';
};

/** Placeholder tim — update nama, foto, dan bio saat data final ada. */
export const ABOUT_TEAM: AboutTeamMember[] = [
  {
    name: '[Nama Founder / CEO]',
    role: 'Founder',
    bio: 'Bio singkat akan ditambahkan.',
    initials: 'JK',
    accent: 'primary',
  },
  {
    name: '[Nama Kepala Kurikulum]',
    role: 'Kurikulum & JLPT',
    bio: 'Bio singkat akan ditambahkan.',
    initials: 'KK',
    accent: 'blue',
  },
  {
    name: '[Nama Lead Sensei]',
    role: 'Pengajar & Konten',
    bio: 'Bio singkat akan ditambahkan.',
    initials: 'LS',
    accent: 'amber',
  },
  {
    name: '[Nama Tim Teknologi]',
    role: 'Platform & Produk',
    bio: 'Bio singkat akan ditambahkan.',
    initials: 'TT',
    accent: 'emerald',
  },
];

export const TEAM_ACCENT: Record<
  AboutTeamMember['accent'],
  string
> = {
  primary: 'bg-linear-to-br from-brand-red to-brand-orange',
  blue: 'bg-linear-to-br from-blue-500 to-indigo-500',
  amber: 'bg-linear-to-br from-amber-500 to-brand-yellow',
  emerald: 'bg-linear-to-br from-emerald-500 to-emerald-600',
};
