import { BookOpen, Trophy, Video, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SEIGAIHA = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='40' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3Ccircle cx='0' cy='40' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3Ccircle cx='60' cy='40' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3Ccircle cx='15' cy='14' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3Ccircle cx='45' cy='14' r='28' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3C/svg%3E")`;

export const AUTH_VALUE_PROPS = [
  {
    icon: BookOpen,
    title: '1000+ Video Lesson',
    desc: 'VOD berkualitas HD dari N5 hingga N1',
  },
  {
    icon: Trophy,
    title: 'Gamifikasi XP & Badge',
    desc: 'Belajar lebih seru dengan sistem reward',
  },
  {
    icon: Zap,
    title: 'JLPT Try Out Center',
    desc: 'Simulasi ujian JLPT resmi & analitik skor',
  },
  {
    icon: Video,
    title: 'Live Class via Zoom',
    desc: 'Sesi langsung bersama sensei berpengalaman',
  },
] as const;

export const FLOATING_KANJI = ['日', '本', '語', '学', '漢', '字'] as const;

export const AUTH_STATS = [
  { val: '32K+', label: 'Pelajar Aktif' },
  { val: '98%', label: 'Tingkat Lulus' },
  { val: 'N5–N1', label: 'Level Lengkap' },
] as const;

export function authInputClass(hasValue: boolean) {
  return cn(
    'w-full rounded-2xl border-2 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition-all',
    hasValue ? 'border-primary bg-primary/5' : 'border-border',
    'focus:border-primary',
  );
}
