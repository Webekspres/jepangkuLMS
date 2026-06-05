import type { LucideIcon } from 'lucide-react';
import { BarChart3, ClipboardList, LogIn, Trophy } from 'lucide-react';
import type { JlptAccent } from '@/features/marketing/components/landing-data';

export type TryoutAvailability = 'tersedia' | 'segera';

export const TRYOUT_OFFERINGS = [
  {
    level: 'N5',
    title: 'JLPT N5 — Simulasi',
    desc: 'Cocok untuk pemula. Format soal mengikuti struktur ujian resmi level N5.',
    duration: '105 menit',
    questions: 60,
    sections: ['文字・語彙', '文法・読解', '聴解'],
    accent: 'emerald' as JlptAccent,
    badge: '入門',
    status: 'tersedia' as TryoutAvailability,
    statusLabel: 'Buka di peluncuran',
  },
  {
    level: 'N4',
    title: 'JLPT N4 — Simulasi',
    desc: 'Latihan menengah-awal dengan fokus tata bahasa dan kosakata N4.',
    duration: '125 menit',
    questions: 70,
    sections: ['文字・語彙', '文法・読解', '聴解'],
    accent: 'blue' as JlptAccent,
    badge: '基礎',
    status: 'segera' as TryoutAvailability,
    statusLabel: 'Segera hadir',
  },
  {
    level: 'N3',
    title: 'JLPT N3 — Simulasi',
    desc: 'Simulasi level menengah dengan teks bacaan dan listening lebih panjang.',
    duration: '140 menit',
    questions: 80,
    sections: ['文字・語彙', '文法・読解', '聴解'],
    accent: 'amber' as JlptAccent,
    badge: '中級',
    status: 'segera' as TryoutAvailability,
    statusLabel: 'Segera hadir',
  },
  {
    level: 'N2',
    title: 'JLPT N2 — Simulasi',
    desc: 'Format lanjutan untuk persiapan ujian tingkat atas.',
    duration: '155 menit',
    questions: 90,
    sections: ['文字・語彙', '文法・読解', '聴解'],
    accent: 'violet' as JlptAccent,
    badge: '上級',
    status: 'segera' as TryoutAvailability,
    statusLabel: 'Segera hadir',
  },
  {
    level: 'N1',
    title: 'JLPT N1 — Simulasi',
    desc: 'Simulasi level tertinggi — untuk pejuang kelulusan N1.',
    duration: '170 menit',
    questions: 100,
    sections: ['文字・語彙', '文法・読解', '聴解'],
    accent: 'brand' as JlptAccent,
    badge: '上達',
    status: 'segera' as TryoutAvailability,
    statusLabel: 'Segera hadir',
  },
] as const;

export const TRYOUT_SCHEDULE = [
  {
    id: 'n5-jun-07',
    dateLabel: '7 Juni 2026',
    dayLabel: 'Sabtu',
    time: '09:00 WIB',
    level: 'N5',
    title: 'Try Out Publik N5',
    note: 'Gratis untuk siswa awal — perlu akun JepangKu',
    status: 'buka' as const,
  },
  {
    id: 'n5-jun-14',
    dateLabel: '14 Juni 2026',
    dayLabel: 'Sabtu',
    time: '09:00 WIB',
    level: 'N5',
    title: 'Try Out Publik N5',
    note: 'Sesi kedua peluncuran MVP',
    status: 'buka' as const,
  },
  {
    id: 'n4-jul-05',
    dateLabel: '5 Juli 2026',
    dayLabel: 'Sabtu',
    time: '09:00 WIB',
    level: 'N4',
    title: 'Try Out Publik N4',
    note: 'Jadwal rencana — mengikuti ketersediaan konten',
    status: 'rencana' as const,
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
    title: 'Buat Akun Gratis',
    desc: 'Daftar di JepangKu untuk mengakses try out dan menyimpan riwayat skor.',
  },
  {
    step: 2,
    icon: ClipboardList,
    title: 'Pilih Level & Jadwal',
    desc: 'Pilih simulasi sesuai target JLPT-mu — mulai dari N5 saat peluncuran.',
  },
  {
    step: 3,
    icon: Trophy,
    title: 'Kerjakan Simulasi',
    desc: 'Mode fokus tanpa distraksi — timer, navigator soal, dan penanda revisi.',
  },
  {
    step: 4,
    icon: BarChart3,
    title: 'Lihat Analitik',
    desc: 'Skor per seksi (語彙・文法・聴解) untuk tahu area yang perlu diperkuat.',
  },
];

export const TRYOUT_BENEFITS = [
  'Format soal mengacu struktur JLPT resmi',
  'Timer & mode fokus seperti ujian sesungguhnya',
  'Analitik skor per seksi setelah selesai',
  'Riwayat try out tersimpan setelah login',
] as const;
