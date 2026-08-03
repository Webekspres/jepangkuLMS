'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PaymentStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { StudentPaymentHistoryItem } from '@/features/payment/lib/load-student-payments';
import { formatIdr } from '@/lib/lms/format-price';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';
import { cn } from '@/lib/utils';

const FILTERS: { id: 'all' | Exclude<PaymentStatus, 'CHALLENGE'>; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'PAID', label: 'Berhasil' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'EXPIRED', label: 'Kedaluwarsa' },
  { id: 'CANCELED', label: 'Dibatalkan' },
  { id: 'FAILED', label: 'Gagal' },
  { id: 'DENIED', label: 'Ditolak' },
];

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  CHALLENGE: 'Sedang diverifikasi',
  PAID: 'Berhasil',
  DENIED: 'Ditolak',
  EXPIRED: 'Kedaluwarsa',
  CANCELED: 'Dibatalkan',
  FAILED: 'Gagal',
};

const TYPE_LABEL = {
  COURSE: 'Kursus',
  LIVE_CLASS: 'Live Class',
  TRYOUT: 'Tryout',
} as const;

function statusBadgeClass(status: PaymentStatus): string {
  if (status === 'PAID') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
  if (status === 'PENDING' || status === 'CHALLENGE') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-800';
  }
  return 'border-destructive/30 bg-destructive/10 text-destructive';
}

export function PaymentHistoryPage({ items }: { items: StudentPaymentHistoryItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground md:text-3xl">
          Riwayat Pembayaran
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Semua transaksi kursus, live class, dan tryout di akunmu.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              filter === f.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Belum ada pembayaran untuk filter ini.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li key={item.id}>
              <Card className="overflow-hidden shadow-sm">
                <CardContent className="flex gap-3 p-4 sm:gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-20">
                    <Image
                      src={item.coverSrc}
                      alt={item.productTitle}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized={isUnoptimizedImageSrc(item.coverSrc)}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {TYPE_LABEL[item.productType]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px]', statusBadgeClass(item.status))}
                        >
                          {STATUS_LABEL[item.status]}
                        </Badge>
                      </div>
                      <p className="mt-2 truncate font-semibold text-foreground">
                        {item.productTitle}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                        {item.orderId}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <p className="font-extrabold text-brand-red">{formatIdr(item.amountIdr)}</p>
                      <Button asChild size="sm" variant="secondary">
                        <Link href={item.detailHref}>Detail</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
