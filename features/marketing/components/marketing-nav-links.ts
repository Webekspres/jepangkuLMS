import type { LucideIcon } from 'lucide-react';
import { BookOpen, ClipboardCheck, Newspaper, Star, Trophy } from 'lucide-react';

export type MarketingNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** External absolute URL — opens in a new tab; never marked active. */
  external?: boolean;
};

export type MarketingFooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

/** Portal Berita (Habibi) — sibling app in the JepangKu ecosystem. */
export const PORTAL_BERITA_URL = 'https://jepangku.com/';

/** Navbar desktop & mobile. */
export const MARKETING_NAV_LINKS: MarketingNavLink[] = [
  { href: '/tentang', label: 'Tentang Kami', icon: Star },
  { href: '/kursus', label: 'Kursus', icon: BookOpen },
  { href: '/tes-penempatan', label: 'Tes Penempatan', icon: ClipboardCheck },
  { href: '/tryout', label: 'Tryout JLPT', icon: Trophy },
  {
    href: PORTAL_BERITA_URL,
    label: 'Artikel',
    icon: Newspaper,
    external: true,
  },
];

export const MARKETING_FOOTER_EXPLORE: MarketingFooterLink[] = [
  { href: '/tentang', label: 'Tentang Kami' },
  { href: '/kursus', label: 'Kursus' },
  { href: '/tes-penempatan', label: 'Tes Penempatan' },
  { href: '/tryout', label: 'JLPT Try Out' },
  { href: PORTAL_BERITA_URL, label: 'Artikel', external: true },
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
