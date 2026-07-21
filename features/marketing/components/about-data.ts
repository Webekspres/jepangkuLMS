import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpen,
  Gamepad2,
  GraduationCap,
  LineChart,
  ListOrdered,
  RefreshCw,
  Trophy,
} from "lucide-react";

/** Konten placeholder — ganti saat copy final dari tim JepangKu tersedia. */
export const ABOUT_HERO = {
  badge: "私たちについて",
  title: "Tentang JepangKu LMS",
  subtitle:
    "JepangKu LMS (Learning Management System) membantu teman-teman Indonesia dalam mempelajari Bahasa Jepang. Kami paham Bahasa Jepang terkadang terasa sulit dan membingungkan. Karena itu kami membuat satu platform yang jelas, mudah, dan menyenangkan.",
} as const;

export const ABOUT_VISION = {
  title: "Visi",
  body: "Menjadi ekosistem edukasi dan informasi Jepang terdepan di Indonesia yang memberdayakan generasi untuk meraih masa depan di Jepang.",
} as const;

export const ABOUT_MISSION = {
  title: "Misi",
  items: [
    "Menyediakan informasi Jepang yang akurat, update, dan bermanfaat.",
    "Menghadirkan pembelajaran bahasa Jepang yang efektif melalui teknologi.",
    "Membangun komunitas yang suportif dan inspiratif.",
  ],
} as const;

export const ABOUT_PILLARS: {
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    icon: BookOpen,
    title: "Kurikulum JLPT",
    desc: "Materi disusun secara terstruktur mengikuti tingkat kemampuan resmi N5 hingga N1.",
  },
  {
    icon: Gamepad2,
    title: "Gamifikasi",
    desc: "XP, badge, dan progress tracker agar belajar bahasa Jepang terasa menyenangkan.",
  },
  {
    icon: GraduationCap,
    title: "Try Out & Kuis",
    desc: "Latihan soal dan simulasi interaktif untuk menguji kesiapan sebelum ujian resmi.",
  },
  {
    icon: LineChart,
    title: "Progress Transparan",
    desc: "Siswa dapat memantau perkembangan materi, hasil kuis, dan riwayat belajar secara real-time.",
  },
];

/** Highlight ringkas di bawah hero — value = judul, label = deskripsi pendek. */
export const ABOUT_FACTS: {
  icon: LucideIcon;
  value: string;
  label: string;
}[] = [
  {
    icon: ListOrdered,
    value: "Langkah demi langkah",
    label: "Lebih terarah",
  },
  {
    icon: BadgeCheck,
    value: "JLPT & CEFR",
    label: "N5–N1 · A1–C1 · Standar internasional",
  },
  {
    icon: Trophy,
    value: "Gamifikasi",
    label: "Menjaga mood belajar",
  },
  {
    icon: RefreshCw,
    value: "Update",
    label: "Tetap relevan",
  },
];

export type AboutTeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
  accent: "primary" | "blue" | "amber" | "emerald";
};

/** Tim JepangKu LMS. */
export const ABOUT_TEAM: AboutTeamMember[] = [
  {
    name: "Ian",
    role: "Visionary Strategist",
    bio: "Japan Enthusiast dengan pengalaman kerja dan bisnis lebih dari 15 tahun.",
    initials: "I",
    accent: "primary",
  },
  {
    name: "Rengga",
    role: "Technology Savvy",
    bio: "Pengembang teknologi JepangKu yang berbasis di Osaka, Jepang.",
    initials: "R",
    accent: "blue",
  },
  {
    name: "Dito",
    role: "Operational Expert",
    bio: "Kuat dalam project governance dan execution control.",
    initials: "D",
    accent: "amber",
  },
  {
    name: "Sensei Lutfi",
    role: "Nihongo Master",
    bio: "Pembentuk kurikulum belajar JepangKu Nihongo.",
    initials: "SL",
    accent: "emerald",
  },
];

export const TEAM_ACCENT: Record<AboutTeamMember["accent"], string> = {
  primary: "bg-linear-to-br from-brand-red to-brand-orange",
  blue: "bg-linear-to-br from-blue-500 to-indigo-500",
  amber: "bg-linear-to-br from-amber-500 to-brand-yellow",
  emerald: "bg-linear-to-br from-emerald-500 to-emerald-600",
};
