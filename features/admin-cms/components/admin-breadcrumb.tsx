'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ADMIN_BREADCRUMB_LABELS } from '@/features/admin-cms/admin-nav-config';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

function segmentLabel(segment: string): string {
  return ADMIN_BREADCRUMB_LABELS[segment] ?? segment.replace(/-/g, ' ');
}

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    return { href, label: segmentLabel(segment), isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="contents">
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href === '/admin' ? ADMIN_ROUTES.dashboard : crumb.href}>
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
