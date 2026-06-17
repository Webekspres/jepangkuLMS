import {
  BookOpen,
  ClipboardList,
  FileUp,
  LayoutDashboard,
  Receipt,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match prefix for nested routes (e.g. /admin/kursus/form) */
  matchPrefix?: boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Utama',
    items: [
      {
        href: ADMIN_ROUTES.dashboard,
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
      {
        href: ADMIN_ROUTES.pembayaran,
        label: 'Pembayaran',
        icon: Receipt,
        matchPrefix: true,
      },
    ],
  },
  {
    label: 'Konten',
    items: [
      {
        href: ADMIN_ROUTES.kursus,
        label: 'Kursus',
        icon: BookOpen,
        matchPrefix: true,
      },
      {
        href: ADMIN_ROUTES.lesson,
        label: 'Lesson',
        icon: Video,
        matchPrefix: true,
      },
      {
        href: ADMIN_ROUTES.quiz,
        label: 'Bank Soal',
        icon: ClipboardList,
        matchPrefix: true,
      },
      {
        href: ADMIN_ROUTES.quizImport,
        label: 'Import CSV',
        icon: FileUp,
      },
    ],
  },
];

export const ADMIN_BREADCRUMB_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  pembayaran: 'Pembayaran',
  kursus: 'Kursus',
  form: 'Form',
  lesson: 'Lesson',
  quiz: 'Bank Soal',
  import: 'Import CSV',
};
