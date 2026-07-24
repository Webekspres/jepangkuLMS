import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';

export function DashboardAttentionBanner({ pendingCount }: { pendingCount: number }) {
  if (pendingCount <= 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {pendingCount} enrollment menunggu verifikasi
          </p>
          <p className="text-xs text-muted-foreground">
            Segera tinjau agar siswa bisa mulai belajar.
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <Link href={ADMIN_ROUTES.pembayaran}>Verifikasi pembayaran</Link>
      </Button>
    </div>
  );
}
