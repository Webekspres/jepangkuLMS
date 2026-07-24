'use client';

import Link from 'next/link';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { cn } from '@/lib/utils';
import type { DashboardRangeDays } from '@/features/admin-cms/lib/load-admin-dashboard-insights';

export function DashboardRangeToggle({ rangeDays }: { rangeDays: DashboardRangeDays }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-sm">
      {([7, 30] as const).map((days) => {
        const active = rangeDays === days;
        return (
          <Link
            key={days}
            href={`${ADMIN_ROUTES.dashboard}?range=${days}`}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {days} hari
          </Link>
        );
      })}
    </div>
  );
}
