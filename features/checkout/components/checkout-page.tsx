'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { payCourseCheckout } from '@/features/checkout/actions/checkout-actions';
import type { PaymentMethodMeta, CheckoutMethodId } from '@/lib/payment-engine/types';
import { formatIdr } from '@/lib/lms/format-price';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';
import { cn } from '@/lib/utils';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { DEFAULT_THUMB } from '@/features/learning/lib/course-display';

type CheckoutPageProps = {
  course: {
    slug: string;
    title: string;
    priceIdr: number;
    imageUrl: string | null;
  };
  methods: PaymentMethodMeta[];
  existingPaymentId: string | null;
};

export function CheckoutPage({ course, methods, existingPaymentId }: CheckoutPageProps) {
  const router = useRouter();
  const [methodId, setMethodId] = useState<CheckoutMethodId | null>(
    methods.find((m) => m.recommended && !m.maintenance)?.id ?? methods[0]?.id ?? null,
  );
  const [isPaying, setIsPaying] = useState(false);
  const priceLabel = formatIdr(course.priceIdr);
  const thumb = course.imageUrl?.trim() || DEFAULT_THUMB;

  const handlePay = async () => {
    if (!methodId) {
      toast.error('Pilih metode pembayaran dulu.');
      return;
    }
    setIsPaying(true);
    try {
      const result = await payCourseCheckout({ courseSlug: course.slug, methodId });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.push(result.redirectPath);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div>
        <Link
          href={STUDENT_ROUTES.kursusDetail(course.slug)}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Kembali ke detail kursus
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold text-foreground">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih metode pembayaran, lalu lanjutkan. Transaksi baru dibuat saat kamu menekan Bayar.
        </p>
      </div>

      <Card>
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
              Ringkasan pesanan
            </p>
            <h2 className="mt-1 line-clamp-2 font-bold text-foreground">{course.title}</h2>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="text-xl font-extrabold text-brand-red">{priceLabel}</span>
              <span className="text-xs text-muted-foreground">sekali bayar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {existingPaymentId ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ada pembayaran tertunda.{' '}
          <Link
            href={STUDENT_ROUTES.pembayaran(existingPaymentId)}
            className="font-semibold underline"
          >
            Lanjutkan pembayaran sebelumnya
          </Link>{' '}
          atau pilih metode baru di bawah (akan mengganti transaksi lama).
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">Metode pembayaran</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {methods.map((method) => {
            const selected = methodId === method.id;
            const disabled = method.maintenance;
            return (
              <li key={method.id}>
                <button
                  type="button"
                  disabled={disabled || isPaying}
                  onClick={() => setMethodId(method.id)}
                  className={cn(
                    'flex w-full flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/40',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{method.displayName}</span>
                    {method.recommended ? (
                      <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Rekomendasi
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 text-xs capitalize text-muted-foreground">
                    {method.category}
                    {disabled ? ` · ${method.maintenanceMessage ?? 'Maintenance'}` : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sticky bottom-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="text-lg font-extrabold text-brand-red">{priceLabel}</span>
        </div>
        <Button
          type="button"
          className="h-11 w-full"
          disabled={!methodId || isPaying}
          onClick={handlePay}
        >
          {isPaying ? 'Memproses…' : 'Bayar Sekarang'}
        </Button>
      </div>
    </div>
  );
}
