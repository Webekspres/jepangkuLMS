import type { LucideIcon } from 'lucide-react';
import { Award, Coins, Trophy, Zap } from 'lucide-react';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import type { StudentCoreData } from '@/features/student/types/student-core-data';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { STUDENT_ROUTES } from './student-routes';

export type DashboardStat = {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  accentClass: string;
};

export function buildDashboardStats(core: StudentCoreData): DashboardStat[] {
  const coreOff = !isCoreIntegrationEnabled();
  const rankSub =
    core.lmsRank != null && core.leaderboardTotal > 0
      ? `dari ${formatDisplayNumber(core.leaderboardTotal)} pelajar`
      : coreOff
        ? 'Leaderboard LMS'
        : core.coreConnected
          ? 'Belum masuk ranking'
          : 'Menghubungkan ke Core…';

  const xpSub = coreOff
    ? 'Integrasi Core dinonaktifkan di dev'
    : core.coreConnected
      ? 'Level global dari Core'
      : 'Menunggu sinkron Core';

  return [
    {
      label: 'Total XP',
      value: formatDisplayNumber(core.totalXp),
      sub: xpSub,
      icon: Zap,
      accentClass: 'text-primary bg-primary/10',
    },
    {
      label: 'Poin LMS',
      value: formatDisplayNumber(core.lmsPoints),
      sub: 'Untuk leaderboard LMS',
      icon: Coins,
      accentClass: 'text-amber-600 bg-amber-500/10',
    },
    {
      label: 'Badge',
      value: String(core.badgeCount),
      sub: core.badgeCount > 0 ? 'Badge terbuka' : 'Belum ada badge',
      icon: Award,
      accentClass: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      label: 'Rank LMS',
      value: core.lmsRank != null ? `#${core.lmsRank}` : '—',
      sub: rankSub,
      icon: Trophy,
      accentClass: 'text-violet-600 bg-violet-500/10',
    },
  ];
}

export type JlptPathItem = {
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  status: 'done' | 'active' | 'locked';
  progress?: number;
};

export const DASHBOARD_JLPT_PATH: JlptPathItem[] = [
  { level: 'N5', status: 'done' },
  { level: 'N4', status: 'active', progress: 77 },
  { level: 'N3', status: 'locked' },
  { level: 'N2', status: 'locked' },
  { level: 'N1', status: 'locked' },
];

export type ContinueLesson = {
  title: string;
  level: string;
  duration: string;
  progress: number;
  category: 'Tata Bahasa' | 'Kosa Kata' | 'Kanji';
  href: string;
  image: string;
};

export const DASHBOARD_CONTINUE_LESSONS: ContinueLesson[] = [
  {
    title: 'Partikel は (wa) dan が (ga)',
    level: 'N5',
    duration: '24 menit',
    progress: 65,
    category: 'Tata Bahasa',
    href: STUDENT_ROUTES.belajar('n5-starter', 'partikel-wa-ga'),
    image:
      'https://images.unsplash.com/photo-1593839154339-377e24b3ba32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    title: 'Kosakata Sehari-hari N4',
    level: 'N4',
    duration: '31 menit',
    progress: 30,
    category: 'Kosa Kata',
    href: STUDENT_ROUTES.belajar('n4-core', 'kosakata-sehari-hari'),
    image:
      'https://images.unsplash.com/photo-1613817048356-ef14b4acc3a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    title: 'Kanji N4: 人・日・月・火',
    level: 'N4',
    duration: '45 menit',
    progress: 0,
    category: 'Kanji',
    href: STUDENT_ROUTES.belajar('n4-core', 'kanji-dasar'),
    image:
      'https://images.unsplash.com/photo-1681317474675-494bd8e91d7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
];

export const LESSON_CATEGORY_STYLE: Record<
  ContinueLesson['category'],
  { badge: string; bar: string }
> = {
  'Tata Bahasa': { badge: 'bg-violet-500/10 text-violet-700', bar: 'bg-violet-500' },
  'Kosa Kata': { badge: 'bg-blue-500/10 text-blue-700', bar: 'bg-blue-500' },
  Kanji: { badge: 'bg-amber-500/10 text-amber-700', bar: 'bg-amber-500' },
};

export const DASHBOARD_WEEKLY_XP = [
  { day: 'Sen', xp: 120 },
  { day: 'Sel', xp: 200 },
  { day: 'Rab', xp: 80 },
  { day: 'Kam', xp: 250 },
  { day: 'Jum', xp: 180 },
  { day: 'Sab', xp: 320 },
  { day: 'Min', xp: 150 },
] as const;

export const DASHBOARD_WEEKLY_XP_MAX = Math.max(...DASHBOARD_WEEKLY_XP.map((d) => d.xp));

export type LeaderboardPreviewRow = {
  rank: number;
  name: string;
  xp: number;
  isYou?: boolean;
};

export const DASHBOARD_LEADERBOARD_PREVIEW: LeaderboardPreviewRow[] = [
  { rank: 1, name: '—', xp: 0 },
  { rank: 2, name: '—', xp: 0 },
  { rank: 3, name: '—', xp: 0 },
  { rank: 4, name: '—', xp: 0, isYou: true },
  { rank: 5, name: '—', xp: 0 },
];

export const DASHBOARD_LIVE_SCHEDULE = [
  {
    title: 'Live Grammar N3 — Pola Conditionals',
    time: 'Hari ini, 19:00 WIB',
    sensei: 'Sensei Tanaka',
    live: true,
  },
  {
    title: 'JLPT N4 Reading Intensive',
    time: 'Besok, 15:00 WIB',
    sensei: 'Sensei Yamamoto',
    live: false,
  },
] as const;
