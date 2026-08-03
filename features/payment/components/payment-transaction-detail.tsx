'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, MessageCircle, Play } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PaymentStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { checkoutPathFor } from '@/lib/payment-engine/products/paths';
import type { CheckoutProductType } from '@/lib/payment-engine/types';
import { buildWhatsAppUrl } from '@/lib/admin-contact';
import { formatIdr } from '@/lib/lms/format-price';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Menunggu pembayaran',
  CHALLENGE: 'Sedang diverifikasi',
  PAID: 'Berhasil',
  DENIED: 'Ditolak',
  EXPIRED: 'Kedaluwarsa',
  CANCELED: 'Dibatalkan',
  FAILED: 'Gagal',
};

const TYPE_LABEL: Record<CheckoutProductType, string> = {
  COURSE: 'Kursus',
  LIVE_CLASS: 'Live Class',
  TRYOUT: 'Tryout',
};

function statusBadgeClass(status: PaymentStatus): string {
  if (status === 'PAID') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
  if (status === 'PENDING' || status === 'CHALLENGE') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-800';
  }
  return 'border-destructive/30 bg-destructive/10 text-destructive';
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

export type PaymentTransactionDetailProps = {
  orderId: string;
  status: PaymentStatus;
  amountIdr: number;
  methodLabel: string;
  createdAt: string;
  paidAt: string | null;
  coverSrc: string;
  historyHref: string;
  product: {
    type: CheckoutProductType;
    key: string;
    title: string;
    successHref: string;
    successLabel: string;
  };
};

export function PaymentTransactionDetail({
  orderId,
  status,
  amountIdr,
  methodLabel,
  createdAt,
  paidAt,
  coverSrc,
  historyHref,
  product,
}: PaymentTransactionDetailProps) {
  const isPaid = status === 'PAID';
  const isTerminalFail =
    status === 'EXPIRED' ||
    status === 'CANCELED' ||
    status === 'FAILED' ||
    status === 'DENIED';

  const helpUrl = buildWhatsAppUrl(
    `Halo, saya butuh bantuan terkait pembayaran order ${orderId} (${product.title}).`,
  );

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: 'Kode transaksi',
      value: <span className="font-mono text-xs sm:text-sm">{orderId}</span>,
    },
    { label: 'Harga dibayar', value: formatIdr(amountIdr) },
    {
      label: 'Status',
      value: (
        <Badge variant="outline" className={cn('text-[10px]', statusBadgeClass(status))}>
          {STATUS_LABEL[status]}
        </Badge>
      ),
    },
    { label: 'Jenis program', value: TYPE_LABEL[product.type] },
    { label: 'Metode pembayaran', value: methodLabel },
    { label: 'Tanggal dibuat', value: formatDateTime(createdAt) },
    ...(isPaid || paidAt
      ? [{ label: 'Tanggal dibayar', value: formatDateTime(paidAt) }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-12">
      <div>
        <Link
          href={historyHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Kembali
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-extrabold md:text-3xl">
          Detail transaksi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Informasi pembayaran programmu.</p>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="flex gap-4 p-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
            <Image
              src={coverSrc}
              alt={product.title}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={isUnoptimizedImageSrc(coverSrc)}
            />
          </div>
          <div className="min-w-0 flex-1 self-center">
            <Badge variant="outline" className="text-[10px] uppercase">
              {TYPE_LABEL[product.type]}
            </Badge>
            <p className="mt-2 font-semibold leading-snug text-foreground">{product.title}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Detail transaksi</p>
          </div>
          <dl className="divide-y divide-border">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <dt className="shrink-0 text-sm text-muted-foreground">{row.label}</dt>
                <dd className="text-sm font-medium text-foreground sm:text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {isPaid ? (
          <Button asChild className="w-full gap-2">
            <Link href={product.successHref}>
              <Play className="size-4" />
              {product.successLabel}
            </Link>
          </Button>
        ) : null}

        {isTerminalFail ? (
          <Button asChild className="w-full">
            <Link href={checkoutPathFor(product.type, product.key)}>Buat pembayaran baru</Link>
          </Button>
        ) : null}

        {isPaid ? (
          <div className="space-y-1.5">
            <Button type="button" variant="outline" className="w-full gap-2" disabled>
              <Download className="size-4" />
              Unduh invoice
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">Segera hadir</p>
          </div>
        ) : null}

        <Button asChild variant="outline" className="w-full gap-2">
          <a href={helpUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" />
            Bantuan admin
          </a>
        </Button>
      </div>
    </div>
  );
}
