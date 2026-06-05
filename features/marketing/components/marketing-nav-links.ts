import type { LucideIcon } from 'lucide-react';
import { BookOpen, GraduationCap, Sparkles, Star, Trophy } from 'lucide-react';

export type MarketingNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const MARKETING_NAV_LINKS: MarketingNavLink[] = [
  { href: '/kursus', label: 'Kursus', icon: BookOpen },
  { href: '/#fitur', label: 'Fitur', icon: Sparkles },
  { href: '/#pricing', label: 'Paket', icon: GraduationCap },
  { href: '/tryout', label: 'Tryout JLPT', icon: Trophy },
  { href: '/tentang', label: 'Tentang Kami', icon: Star },
];
