import Link from 'next/link';
import { BarChart3, ExternalLink, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminAnalyticsConfig } from '@/features/admin-cms/lib/load-admin-analytics-config';
import { cn } from '@/lib/utils';

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        ok
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
      )}
    >
      {label}
    </Badge>
  );
}

export function AdminAnalyticsPanel({ config }: { config: AdminAnalyticsConfig }) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <BarChart3 className="size-5 text-primary" aria-hidden />
          Analytics & SEO
        </CardTitle>
        <CardDescription>
          Google Analytics 4 untuk perilaku pengunjung dan Search Console untuk indeks Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Google Analytics 4</p>
              <StatusBadge
                ok={config.gaConfigured}
                label={config.gaConfigured ? 'Terhubung' : 'Belum dikonfigurasi'}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {config.gaMeasurementId
                ? `Measurement ID: ${config.gaMeasurementId}`
                : 'Set NEXT_PUBLIC_GA_MEASUREMENT_ID di environment deploy.'}
            </p>
            {config.gaConsoleUrl ? (
              <Button asChild variant="outline" size="sm" className="mt-3 gap-1.5">
                <Link href={config.gaConsoleUrl} target="_blank" rel="noopener noreferrer">
                  Buka GA4
                  <ExternalLink className="size-3.5" aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Search Console</p>
              <StatusBadge
                ok={config.gscConfigured}
                label={config.gscConfigured ? 'Verifikasi siap' : 'Token belum di-set'}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Meta verifikasi situs otomatis dari NEXT_PUBLIC_GSC_VERIFICATION.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3 gap-1.5">
              <Link href={config.gscConsoleUrl} target="_blank" rel="noopener noreferrer">
                <Search className="size-3.5" aria-hidden />
                Buka Search Console
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Event LMS yang dilacak: page view, pemutaran video pelajaran, dan unlock video terproteksi.
          Laporan lengkap tersedia di konsol Google.
        </p>
      </CardContent>
    </Card>
  );
}
