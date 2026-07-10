import {
    Award,
    BookOpen,
    FileUp,
    LayoutDashboard,
    Package,
    Receipt,
    Target,
    Users,
    Video,
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
        id: 'overview',
        label: 'Overview',
        items: [
            {
                id: 'dashboard',
                href: ADMIN_ROUTES.dashboard,
                label: 'Dashboard',
                icon: LayoutDashboard,
                exact: true,
            },
        ],
    },
    {
        id: 'students',
        label: 'Siswa & Akses',
        items: [
            {
                id: 'pembayaran',
                href: ADMIN_ROUTES.pembayaran,
                label: 'Enrollment',
                icon: Receipt,
                matchPrefix: true,
            },
            {
                id: 'users',
                href: ADMIN_ROUTES.users,
                label: 'Pengguna',
                icon: Users,
                matchPrefix: true,
            },
        ],
    },
    {
        id: 'curriculum',
        label: 'Kurikulum',
        items: [
            {
                id: 'kursus',
                href: ADMIN_ROUTES.kursus,
                label: 'Kursus',
                icon: BookOpen,
                matchPrefix: true,
            },
            {
                id: 'import',
                href: ADMIN_ROUTES.kursusImport,
                label: 'Import Kursus',
                icon: FileUp,
            },
        ],
    },
    {
        id: 'programs',
        label: 'Program',
        items: [
            {
                id: 'live-class',
                href: ADMIN_ROUTES.liveClass,
                label: 'Live Class',
                icon: Video,
                matchPrefix: true,
            },
            {
                id: 'tryout',
                href: ADMIN_ROUTES.tryoutSessions,
                label: 'JLPT Tryout',
                icon: Target,
                matchPrefix: true,
            },
            {
                id: 'tryout-paket',
                href: ADMIN_ROUTES.tryoutPaket,
                label: 'Paket Soal JLPT',
                icon: Package,
                matchPrefix: true,
            },
        ],
    },
    {
        id: 'gamification',
        label: 'Gamifikasi',
        items: [
            {
                id: 'badges',
                href: ADMIN_ROUTES.badges,
                label: 'Badge',
                icon: Award,
                matchPrefix: true,
            },
        ],
    },
];

export const ADMIN_BREADCRUMB_LABELS: Record<string, string> = {
    admin: 'Admin',
    dashboard: 'Dashboard',
    pembayaran: 'Enrollment',
    users: 'Pengguna',
    kursus: 'Kursus',
    form: 'Form',
    modul: 'Modul',
    lesson: 'Pelajaran',
    quiz: 'Bank Soal',
    import: 'Import Kursus',
    badges: 'Badge',
    'live-class': 'Live Class',
    tryout: 'JLPT Tryout',
    bank: 'Bank Soal JLPT',
    paket: 'Paket Soal',
    susun: 'Susun Sesi (legacy)',
    soal: 'Soal Legacy',
    'tryout/import': 'Import Tryout (legacy)',
    'tryout/paket/import': 'Import Paket',
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
