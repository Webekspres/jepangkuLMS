import Link from 'next/link';
import type { DashboardActivityItem } from '@/features/admin-cms/lib/load-admin-dashboard-insights';
import {
  ENROLLMENT_LOG_ACTION_BADGE,
  ENROLLMENT_LOG_ACTION_LABEL,
} from '@/features/admin-cms/lib/enrollment-log-labels';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TYPE_LABEL = {
  COURSE: 'Kursus',
  LIVE_CLASS: 'Live Class',
  TRYOUT: 'Tryout',
} as const;

function relativeTimeId(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60_000));
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function DashboardRecentActivity({ items }: { items: DashboardActivityItem[] }) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base font-bold">Aktivitas terbaru</CardTitle>
          <CardDescription>Log enrollment & tindakan admin.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href={ADMIN_ROUTES.pembayaran}>Lihat semua</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas.</p>
        ) : (
          <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] font-medium',
                        ENROLLMENT_LOG_ACTION_BADGE[item.action],
                      )}
                    >
                      {ENROLLMENT_LOG_ACTION_LABEL[item.action]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {TYPE_LABEL[item.type]}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium text-foreground">{item.productTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.studentName?.trim() || 'Siswa'} · {relativeTimeId(item.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
