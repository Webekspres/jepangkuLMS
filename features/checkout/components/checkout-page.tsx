'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  payCheckout,
  paySnapCheckout,
} from '@/features/checkout/actions/checkout-actions';
import { PaymentMethodSelector } from '@/features/checkout/components/payment-method-selector';
import { openSnapPayUx } from '@/features/checkout/lib/snap-pay-ux';
import type {
  CheckoutMethodId,
  CheckoutProductType,
  PaymentMethodMeta,
} from '@/lib/payment-engine/types';
import { formatIdr } from '@/lib/lms/format-price';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { DEFAULT_THUMB } from '@/features/learning/lib/course-display';

export type CheckoutProductSummary = {
  type: CheckoutProductType;
  key: string;
  title: string;
  priceIdr: number;
  imageUrl: string | null;
  backHref: string;
};

type CheckoutPageProps = {
  product: CheckoutProductSummary;
  methods: PaymentMethodMeta[];
  existingPaymentId: string | null;
  checkoutMode: 'snap' | 'core';
  midtransClientKey: string | null;
  midtransSnapUrl: string | null;
};

const TYPE_LABEL: Record<CheckoutProductType, string> = {
  COURSE: 'Kursus',
  LIVE_CLASS: 'Live Class',
  TRYOUT: 'JLPT Tryout',
};

export function CheckoutPage({
  product,
  methods,
  existingPaymentId,
  checkoutMode,
  midtransClientKey,
  midtransSnapUrl,
}: CheckoutPageProps) {
  const router = useRouter();
  const isSnap = checkoutMode === 'snap';
  const [methodId, setMethodId] = useState<CheckoutMethodId | null>(
    methods.find((m) => m.recommended && !m.maintenance)?.id ?? methods[0]?.id ?? null,
  );
  const [isPaying, setIsPaying] = useState(false);
  const priceLabel = formatIdr(product.priceIdr);
  const thumb = product.imageUrl?.trim() || DEFAULT_THUMB;
  const canLoadSnap = isSnap && Boolean(midtransClientKey) && Boolean(midtransSnapUrl);

  const goPaymentDetail = (paymentId: string) => {
    router.push(STUDENT_ROUTES.pembayaran(paymentId));
  };

  const handlePayCore = async () => {
    if (!methodId) {
      toast.error('Pilih metode pembayaran dulu.');
      return;
    }
    setIsPaying(true);
    try {
      const result = await payCheckout({
        productType: product.type,
        productKey: product.key,
        methodId,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.push(result.redirectPath);
    } finally {
      setIsPaying(false);
    }
  };

  const handlePaySnap = async () => {
    if (!canLoadSnap) {
      toast.error('Snap Midtrans belum dikonfigurasi.');
      return;
    }
    setIsPaying(true);
    try {
      const result = await paySnapCheckout({
        productType: product.type,
        productKey: product.key,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (!result.snapToken) {
        toast.error('Token Snap tidak tersedia.');
        goPaymentDetail(result.paymentId);
        return;
      }
      await openSnapPayUx({
        snapToken: result.snapToken,
        paymentId: result.paymentId,
        callbacks: {
          onNavigateToPaymentDetail: goPaymentDetail,
          onToast: (kind, message) => {
            if (kind === 'error') toast.error(message);
            else toast.message(message);
          },
        },
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {canLoadSnap ? (
        <Script
          id="midtrans-snap"
          src={midtransSnapUrl!}
          data-client-key={midtransClientKey!}
          strategy="afterInteractive"
        />
      ) : null}

      <div>
        <Link href={product.backHref} className="text-sm text-muted-foreground hover:text-primary">
          ← Kembali
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-extrabold text-foreground md:text-3xl">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSnap
            ? 'Bayar lewat Midtrans Snap. Status akses dikonfirmasi otomatis setelah webhook — bukan dari popup saja.'
            : 'Pilih metode pembayaran, lalu lanjutkan. Transaksi dibuat saat kamu menekan Bayar.'}
        </p>
      </div>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardContent className="flex gap-4 p-5">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={thumb}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
              unoptimized={isUnoptimizedImageSrc(thumb)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {TYPE_LABEL[product.type]}
            </p>
            <h2 className="mt-1 line-clamp-2 font-heading text-lg font-bold text-foreground">
              {product.title}
            </h2>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="text-xl font-extrabold text-brand-red">{priceLabel}</span>
              <span className="text-xs text-muted-foreground">sekali bayar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {existingPaymentId ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          Ada pembayaran tertunda.{' '}
          <Link
            href={STUDENT_ROUTES.pembayaran(existingPaymentId)}
            className="font-semibold text-primary underline"
          >
            Buka halaman pembayaran
          </Link>
          {isSnap
            ? ' untuk lanjutkan Snap atau cek status.'
            : ' atau pilih metode baru di bawah (akan mengganti transaksi lama).'}
        </div>
      ) : null}

      {!isSnap ? (
        <div>
          <h2 className="mb-4 text-sm font-bold text-foreground">Metode pembayaran</h2>
          {methods.length === 0 ? (
            <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Belum ada metode Core yang diaktifkan admin. Hubungi admin atau coba lagi nanti.
            </p>
          ) : (
            <PaymentMethodSelector
              methods={methods}
              value={methodId}
              onChange={setMethodId}
              disabled={isPaying}
            />
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Metode pembayaran ditampilkan di jendela Midtrans Snap (sesuai Snap Preferences di
          dashboard Midtrans).
        </p>
      )}

      <div className="sticky bottom-4 rounded-2xl border border-border bg-card/95 p-4 shadow-md backdrop-blur">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="text-lg font-extrabold text-brand-red">{priceLabel}</span>
        </div>
        <Button
          type="button"
          className="h-11 w-full"
          disabled={isPaying || (!isSnap && !methodId)}
          onClick={isSnap ? handlePaySnap : handlePayCore}
        >
          {isPaying ? 'Memproses…' : isSnap ? 'Bayar dengan Midtrans' : 'Bayar Sekarang'}
        </Button>
      </div>
    </div>
  );
}
