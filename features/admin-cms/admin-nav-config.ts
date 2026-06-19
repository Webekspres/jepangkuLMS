import {
  BookOpen,
  ClipboardList,
  FileUp,
  LayoutDashboard,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

export type AdminNavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match prefix for nested routes */
  matchPrefix?: boolean;
  exact?: boolean;
  comingSoon?: boolean;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'main',
    label: 'Utama',
    items: [
      {
        id: 'dashboard',
        href: ADMIN_ROUTES.dashboard,
        label: 'Dashboard',
        icon: LayoutDashboard,
        exact: true,
      },
      {
        id: 'pembayaran',
        href: ADMIN_ROUTES.pembayaran,
        label: 'Enrollment',
        icon: Receipt,
        matchPrefix: true,
      },
    ],
  },
  {
    id: 'content',
    label: 'Konten',
    items: [
      {
        id: 'kursus',
        href: ADMIN_ROUTES.kursus,
        label: 'Kursus',
        icon: BookOpen,
        matchPrefix: true,
      },
      {
        id: 'quiz',
        href: ADMIN_ROUTES.quiz,
        label: 'Bank Soal',
        icon: ClipboardList,
        matchPrefix: true,
      },
      {
        id: 'import',
        href: ADMIN_ROUTES.kursusImport,
        label: 'Import CSV',
        icon: FileUp,
      },
    ],
  },
];

export const ADMIN_BREADCRUMB_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  pembayaran: 'Enrollment',
  kursus: 'Kursus',
  form: 'Form',
  modul: 'Modul',
  lesson: 'Pelajaran',
  quiz: 'Bank Soal',
  import: 'Import CSV',
  'kursus/import': 'Import Kursus',
};

/** Longest-prefix match — hindari /admin/kursus menang atas sub-rute lain. */
export function getActiveAdminNavHref(pathname: string): string {
  const allItems = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
  let best: AdminNavItem | null = null;

  for (const item of allItems) {
    if (item.comingSoon) continue;
    const matches =
      item.exact === true
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!matches) continue;
    if (!best || item.href.length > best.href.length) {
      best = item;
    }
  }

  return best?.href ?? ADMIN_ROUTES.dashboard;
}
