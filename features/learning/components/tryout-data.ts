import type { LucideIcon } from 'lucide-react';
import { BarChart3, ClipboardList, LogIn, Trophy } from 'lucide-react';
import type { JlptAccent } from '@/features/marketing/components/landing-data';

export type TryoutAvailability = 'tersedia' | 'segera';

export const TRYOUT_OFFERINGS = [
  {
    level: 'N5',
    title: 'JLPT N5 — Simulasi Pemula',
    desc: 'Uji kemampuan dasar Anda meliputi pengenalan Hiragana, Katakana, Kanji dasar, dan frasa sehari-hari terstandarisasi JLPT.',
    duration: '105 menit',
    questions: 60,
    sections: ['文字・語彙 (Kosakata)', '文法・読解 (Tata Bahasa & Bacaan)', '聴解 (Mendengar)'],
    accent: 'emerald' as JlptAccent,
    badge: '入門',
    status: 'tersedia' as TryoutAvailability,
    statusLabel: 'Tersedia',
  },
  {
    level: 'N4',
    title: 'JLPT N4 — Simulasi Dasar-Lanjut',
    desc: 'Evaluasi pemahaman tata bahasa tingkat dasar-lanjut, percakapan sehari-hari, dan kemampuan membaca teks sederhana.',
    duration: '125 menit',
    questions: 70,
    sections: ['文字・語彙 (Kosakata)', '文法・読解 (Tata Bahasa & Bacaan)', '聴解 (Mendengar)'],
    accent: 'blue' as JlptAccent,
    badge: '基礎',
    status: 'segera' as TryoutAvailability,
    statusLabel: 'Segera Hadir',
  },
  {
    level: 'N3',
    title: 'JLPT N3 — Simulasi Menengah',
    desc: 'Simulasi tingkat menengah dengan teks bacaan yang lebih kompleks, struktur tata bahasa fungsional, dan listening berkecepatan normal.',
    duration: '140 menit',
    questions: 80,
    sections: ['文字・語彙 (Kosakata)', '文法・読解 (Tata Bahasa & Bacaan)', '聴解 (Mendengar)'],
    accent: 'amber' as JlptAccent,
    badge: '中級',
    status: 'segera' as TryoutAvailability,
    statusLabel: 'Segera Hadir',
  },
  {
    level: 'N2',
    title: 'JLPT N2 — Simulasi Lanjut',
    desc: 'Tingkat mahir untuk menguji pemahaman artikel koran, opini mendalam, serta percakapan situasi bisnis dan akademik.',
    duration: '155 menit',
    questions: 90,
    sections: ['文字・語彙 (Kosakata)', '文法・読解 (Tata Bahasa & Bacaan)', '聴解 (Mendengar)'],
    accent: 'violet' as JlptAccent,
    badge: '上級',
    status: 'segera' as TryoutAvailability,
    statusLabel: 'Segera Hadir',
  },
  {
    level: 'N1',
    title: 'JLPT N1 — Simulasi Profesional',
    desc: 'Ujian level tertinggi untuk menguji penguasaan bahasa Jepang setara penutur asli di berbagai konteks formal dan profesional.',
    duration: '170 menit',
    questions: 100,
    sections: ['文字・語彙 (Kosakata)', '文法・読解 (Tata Bahasa & Bacaan)', '聴解 (Mendengar)'],
    accent: 'brand' as JlptAccent,
    badge: '上達',
    status: 'segera' as TryoutAvailability,
    statusLabel: 'Segera Hadir',
  },
] as const;

export const TRYOUT_STEPS: {
  step: number;
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    step: 1,
    icon: LogIn,
    title: 'Buat Akun JepangKu',
    desc: 'Daftar secara gratis untuk mengakses dasbor belajar dan menyimpan riwayat pencapaian try out Anda.',
  },
  {
    step: 2,
    icon: ClipboardList,
    title: 'Pilih Level Simulasi',
    desc: 'Pilih tingkat ujian sesuai target Anda. Mulai dengan simulasi level N5 yang sudah terintegrasi penuh.',
  },
  {
    step: 3,
    icon: Trophy,
    title: 'Kerjakan Mode Ujian',
    desc: 'Pengalaman ujian real-time dengan timer otomatis, navigasi soal fleksibel, dan audio listening berkualitas tinggi.',
  },
  {
    step: 4,
    icon: BarChart3,
    title: 'Analisis Skor Detail',
    desc: 'Dapatkan grafik rincian nilai per bagian kompetensi untuk mendeteksi kelemahan materi belajar Anda secara instan.',
  },
];

export const TRYOUT_BENEFITS = [
  'Format dan bobot soal sesuai standar JLPT resmi',
  'Simulasi waktu nyata (real-time timer) untuk melatih manajemen waktu',
  'Grafik evaluasi per seksi (Kosakata, Tata Bahasa, Membaca, Mendengar)',
  'Laporan hasil dan pembahasan lengkap tersimpan di portofolio akun Anda',
] as const;
