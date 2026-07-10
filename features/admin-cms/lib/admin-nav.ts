import {
  ADMIN_BREADCRUMB_LABELS,
  ADMIN_NAV_GROUPS,
  getActiveAdminNavHref,
  type AdminNavGroup,
} from '@/features/admin-cms/admin-nav-config';

export { ADMIN_NAV_GROUPS, getActiveAdminNavHref };
export type { AdminNavGroup };

export type AdminBreadcrumb = {
  label: string;
  href?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(segment: string): boolean {
  return UUID_RE.test(segment);
}

function segmentLabel(segment: string, previous?: string): string {
  if (segment === 'form') return 'Form';
  if (segment === 'modul') return 'Modul';
  if (segment === 'lesson') return 'Pelajaran';
  if (previous === 'kursus' && isUuid(segment)) return 'Detail Kursus';
  if (previous === 'modul' && isUuid(segment)) return 'Detail Modul';
  if (segment === 'import' && previous === 'paket') return 'Import Paket';
  if (segment === 'import' && previous === 'tryout') return 'Import Tryout (legacy)';
  return ADMIN_BREADCRUMB_LABELS[segment] ?? segment;
}

export function getAdminBreadcrumbs(pathname: string): AdminBreadcrumb[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'admin') return [{ label: 'Admin' }];

  const crumbs: AdminBreadcrumb[] = [{ label: 'Admin', href: '/admin/dashboard' }];
  let path = '';

  for (let i = 1; i < segments.length; i += 1) {
    const segment = segments[i];
    path += `/${segment}`;
    const previous = segments[i - 1];
    const isLast = i === segments.length - 1;

    crumbs.push({
      label: segmentLabel(segment, previous),
      href: isLast ? undefined : `/admin${path}`,
    });
  }

  return crumbs;
}
