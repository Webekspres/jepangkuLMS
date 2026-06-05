import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Layers,
  Play,
  Trophy,
  Zap,
} from 'lucide-react';

export const LEARNING_GUIDE_HERO = {
  badge: '学び方',
  title: 'Cara Belajar di JepangKu',
  subtitle:
    'Panduan singkat alur belajar, level JLPT, dan sistem XP — supaya kamu tahu apa yang akan kamu lakukan setelah daftar.',
} as const;

export type LearningStep = {
  step: number;
  icon: LucideIcon;
  title: string;
  desc: string;
};

export const LEARNING_STEPS: LearningStep[] = [
  {
    step: 1,
    icon: BookOpen,
    title: 'Daftar & pilih kursus',
    desc: 'Buat akun gratis, lalu mulai dari kursus N5 yang sudah tersedia. Level lain menyusul bertahap.',
  },
  {
    step: 2,
    icon: Play,
    title: 'Pelajari materi per lesson',
    desc: 'Buka workspace belajar: baca materi, tonton video embed, dan tandai lesson selesai saat sudah paham.',
  },
  {
    step: 3,
    icon: CheckCircle2,
    title: 'Kerjakan kuis di akhir bab',
    desc: 'Setiap lesson bisa punya kuis interaktif. Jawab soal pilihan ganda untuk mengunci pemahaman.',
  },
  {
    step: 4,
    icon: Zap,
    title: 'Kumpulkan XP & badge',
    desc: 'Skor kuis dan penyelesaian materi menambah XP. Naik level profil dan buka badge pencapaian.',
  },
  {
    step: 5,
    icon: Trophy,
    title: 'Try out & pantau progres',
    desc: 'Ikuti simulasi JLPT dan lihat leaderboard untuk motivasi — semua dari dashboard setelah login.',
  },
];

export const XP_RULES: { label: string; xp: string }[] = [
  { label: 'Menyelesaikan 1 lesson', xp: '+10 XP' },
  { label: 'Lulus kuis (skor ≥ 70%)', xp: '+25 XP' },
  { label: 'Skor sempurna kuis', xp: '+40 XP' },
  { label: 'Try out selesai', xp: '+50 XP' },
];

export const LEVEL_GUIDE: {
  level: string;
  label: string;
  desc: string;
  status: string;
  accent: 'emerald' | 'blue' | 'amber' | 'violet' | 'brand';
}[] = [
  {
    level: 'N5',
    label: 'Pemula',
    desc: 'Hiragana, Katakana, kanji dasar, dan tata bahasa fundamental.',
    status: 'Modul awal tersedia',
    accent: 'emerald',
  },
  {
    level: 'N4',
    label: 'Dasar',
    desc: 'Perluas kosakata, kanji, dan pola kalimat sehari-hari.',
    status: 'Segera hadir',
    accent: 'blue',
  },
  {
    level: 'N3',
    label: 'Menengah',
    desc: 'Membaca teks panjang dan percakapan kompleks.',
    status: 'Segera hadir',
    accent: 'amber',
  },
  {
    level: 'N2',
    label: 'Lanjutan',
    desc: 'Bahasa formal, dokumen, dan nuansa konteks.',
    status: 'Segera hadir',
    accent: 'violet',
  },
  {
    level: 'N1',
    label: 'Mahir',
    desc: 'Setara native untuk konteks akademik & profesional.',
    status: 'Segera hadir',
    accent: 'brand',
  },
];

export const LEARNING_TIPS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Layers,
    title: 'Ikuti urutan silabus',
    desc: 'Materi disusun berjenjang — loncat level bisa bikin gap pemahaman.',
  },
  {
    icon: Award,
    title: 'Jangan skip kuis',
    desc: 'Kuis bukan hanya tes; XP dan feedback langsung membantu ingat materi.',
  },
  {
    icon: Zap,
    title: 'Belajar rutin sedikit-sedikit',
    desc: '15–30 menit per hari lebih efektif daripada cramming seminggu sekali.',
  },
];
