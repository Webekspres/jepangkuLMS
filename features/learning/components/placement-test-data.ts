import type { LucideIcon } from 'lucide-react';
import { ClipboardCheck, Compass, LogIn, Target } from 'lucide-react';

export const PLACEMENT_BENEFITS = [
  'Gratis untuk semua calon siswa JepangKu',
  'Bantu tentukan level JLPT yang paling cocok',
  'Rekomendasi jalur belajar setelah hasil keluar',
  'Dilanjutkan di dasbor setelah daftar / masuk',
] as const;

export const PLACEMENT_STEPS: {
  step: number;
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    step: 1,
    icon: LogIn,
    title: 'Daftar atau masuk',
    desc: 'Buat akun JepangKu gratis, atau masuk jika sudah punya akun.',
  },
  {
    step: 2,
    icon: ClipboardCheck,
    title: 'Kerjakan tes penempatan',
    desc: 'Jawab soal diagnostik singkat untuk mengukur kemampuan saat ini.',
  },
  {
    step: 3,
    icon: Compass,
    title: 'Dapatkan rekomendasi level',
    desc: 'Lihat indikasi level JLPT dan lanjut ke kursus yang sesuai.',
  },
];

export const PLACEMENT_HIGHLIGHT = {
  icon: Target,
  title: 'Bukan try out resmi',
  desc: 'Tes penempatan bersifat diagnostik untuk memulai belajar. Simulasi ujian JLPT lengkap ada di halaman Tryout JLPT.',
} as const;
