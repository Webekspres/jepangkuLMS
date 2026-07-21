import { STUDENT_ROUTES } from './student-routes';

export type StudentNavLinkItem = {
  kind: 'link';
  href: string;
  label: string;
};

export type StudentNavLinkGroup = {
  kind: 'group';
  label: string;
  baseHref: string;
  children: { href: string; label: string }[];
};

export type StudentNavItem = StudentNavLinkItem | StudentNavLinkGroup;

/** Navigasi utama area siswa — flat link atau grup submenu. */
export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  { kind: 'link', href: STUDENT_ROUTES.home, label: 'Beranda' },
  {
    kind: 'group',
    label: 'Program',
    baseHref: STUDENT_ROUTES.kursus,
    children: [
      { href: STUDENT_ROUTES.kursus, label: 'Kursus' },
      { href: STUDENT_ROUTES.liveClass, label: 'Live Class' },
      { href: STUDENT_ROUTES.tryout, label: 'Tryout JLPT' },
    ],
  },
  {
    kind: 'group',
    label: 'Aksara',
    baseHref: STUDENT_ROUTES.kana,
    children: [
      { href: STUDENT_ROUTES.kanaScript('hiragana'), label: 'Hiragana' },
      { href: STUDENT_ROUTES.kanaScript('katakana'), label: 'Katakana' },
    ],
  },
  { kind: 'link', href: STUDENT_ROUTES.leaderboard, label: 'Leaderboard' },
];

/** @deprecated Gunakan `STUDENT_NAV_ITEMS` — flat list untuk kompatibilitas. */
export const STUDENT_NAV_LINKS = STUDENT_NAV_ITEMS.flatMap((item) =>
  item.kind === 'link'
    ? [{ href: item.href, label: item.label }]
    : item.children.map((child) => ({ href: child.href, label: `${item.label} · ${child.label}` })),
);

export function isStudentNavLink(item: StudentNavItem): item is StudentNavLinkItem {
  return item.kind === 'link';
}

export function isStudentNavGroup(item: StudentNavItem): item is StudentNavLinkGroup {
  return item.kind === 'group';
}

export function isStudentNavHrefActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  if (href === STUDENT_ROUTES.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isStudentNavGroupActive(pathname: string, group: StudentNavLinkGroup): boolean {
  if (isStudentNavHrefActive(pathname, group.baseHref)) return true;
  return group.children.some((child) => isStudentNavHrefActive(pathname, child.href));
}
