import {
    Award,
    BookOpen,
    CreditCard,
    FileUp,
    LayoutDashboard,
    Package,
    Receipt,
    Settings,
    Target,
    Users,
    Video,
    type LucideIcon,
} from 'lucide-react';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import type { CheckoutMode } from '@/lib/midtrans/config';

export const PAYMENT_METHODS_NAV_ITEM_ID = 'metode-pembayaran';

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
            {
                id: 'settings',
                href: ADMIN_ROUTES.settings,
                label: 'Pengaturan',
                icon: Settings,
                matchPrefix: true,
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
                id: 'metode-pembayaran',
                href: ADMIN_ROUTES.metodePembayaran,
                label: 'Pembayaran',
                icon: CreditCard,
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
    'metode-pembayaran': 'Pembayaran',
    users: 'Pengguna',
    kursus: 'Kursus',
    form: 'Form',
    modul: 'Modul',
    lesson: 'Pelajaran',
    quiz: 'Bank Soal',
    import: 'Import Kursus',
    badges: 'Badge',
    grant: 'Beri Badge',
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

/** Snap checkout: metode Core API dikelola di Midtrans MAP, bukan CMS. */
export function resolveAdminNavGroups(options?: { checkoutMode?: CheckoutMode }): AdminNavGroup[] {
    const hidePaymentMethods = options?.checkoutMode === 'snap';
    if (!hidePaymentMethods) return ADMIN_NAV_GROUPS;

    return ADMIN_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => item.id !== PAYMENT_METHODS_NAV_ITEM_ID),
    })).filter((group) => group.items.length > 0);
}

/** Longest-prefix match — hindari /admin/kursus menang atas sub-rute lain. */
export function getActiveAdminNavHref(
    pathname: string,
    groups: AdminNavGroup[] = ADMIN_NAV_GROUPS,
): string {
    const allItems = groups.flatMap((group) => group.items);
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
