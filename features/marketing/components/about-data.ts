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
  body: 'Menjadi ekosistem edukasi dan informasi Jepang terdepan di Indonesia yang memberdayakan generasi untuk meraih masa depan di Jepang.',
} as const;

export const ABOUT_MISSION = {
  title: 'Misi',
  items: [
    'Menyediakan informasi Jepang yang akurat, update, dan bermanfaat.',
    'Menghadirkan pembelajaran bahasa Jepang yang efektif melalui teknologi.',
    'Membangun komunitas yang suportif dan inspiratif.',
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
    desc: 'Materi disusun secara terstruktur mengikuti tingkat kemampuan resmi N5 hingga N1.',
  },
  {
    icon: Gamepad2,
    title: 'Gamifikasi',
    desc: 'XP, badge, dan progress tracker agar belajar bahasa Jepang terasa menyenangkan.',
  },
  {
    icon: GraduationCap,
    title: 'Try Out & Kuis',
    desc: 'Latihan soal dan simulasi interaktif untuk menguji kesiapan sebelum ujian resmi.',
  },
  {
    icon: LineChart,
    title: 'Progress Transparan',
    desc: 'Siswa dapat memantau perkembangan materi, hasil kuis, dan riwayat belajar secara real-time.',
  },
];

/** Faktual untuk brand baru — bukan statistik sosial palsu. */
export const ABOUT_FACTS = [
  { label: 'Peluncuran', value: '2026' },
  { label: 'Level JLPT & CEFR', value: 'N5–N1 & A1–C1' },
  { label: 'Gamifikasi', value: 'Serius Tapi Seru' },
  { label: 'Ekosistem', value: 'LMS + Portal' },
] as const;

export type AboutTeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
  accent: 'primary' | 'blue' | 'amber' | 'emerald';
};

/** Tim JepangKu LMS. */
export const ABOUT_TEAM: AboutTeamMember[] = [
  {
    name: 'Ian',
    role: 'Visionary Strategist',
    bio: 'Japan Enthusiast dengan pengalaman kerja dan bisnis lebih dari 15 tahun.',
    initials: 'I',
    accent: 'primary',
  },
  {
    name: 'Rengga',
    role: 'Technology Savvy',
    bio: 'Pengembang teknologi JepangKu yang berbasis di Osaka, Jepang.',
    initials: 'R',
    accent: 'blue',
  },
  {
    name: 'Dito',
    role: 'Operational Expert',
    bio: 'Kuat dalam project governance dan execution control.',
    initials: 'D',
    accent: 'amber',
  },
  {
    name: 'Sensei Lutfi',
    role: 'Nihongo Master',
    bio: 'Pembentuk kurikulum belajar JepangKu Nihongo.',
    initials: 'SL',
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
