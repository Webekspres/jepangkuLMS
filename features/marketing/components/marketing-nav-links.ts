import type { LucideIcon } from 'lucide-react';
import { BookOpen, Star, Trophy } from 'lucide-react';

export type MarketingNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type MarketingFooterLink = {
  href: string;
  label: string;
};

/** Navbar desktop & mobile — hanya 3 link utama. */
export const MARKETING_NAV_LINKS: MarketingNavLink[] = [
  { href: '/tentang', label: 'Tentang Kami', icon: Star },
  { href: '/kursus', label: 'Kursus', icon: BookOpen },
  { href: '/tryout', label: 'Tryout JLPT', icon: Trophy },
];

export const MARKETING_FOOTER_EXPLORE: MarketingFooterLink[] = [
  { href: '/tentang', label: 'Tentang Kami' },
  { href: '/kursus', label: 'Kursus' },
  { href: '/tryout', label: 'JLPT Try Out' },
];

export const MARKETING_FOOTER_SUPPORT: MarketingFooterLink[] = [
  { href: '/cara-belajar', label: 'Cara Belajar' },
  { href: '/hubungi', label: 'Kontak' },
];

export const MARKETING_FOOTER_LEGAL: MarketingFooterLink[] = [
  { href: '/syarat-ketentuan', label: 'Syarat & Ketentuan' },
  { href: '/kebijakan-privasi', label: 'Kebijakan Privasi' },
];

/** @deprecated Gunakan grup footer di atas — disimpan untuk kompatibilitas. */
export const MARKETING_FOOTER_LINKS: MarketingFooterLink[] = [
  ...MARKETING_FOOTER_EXPLORE,
  ...MARKETING_FOOTER_SUPPORT,
  ...MARKETING_FOOTER_LEGAL,
];
