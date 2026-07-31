'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  cancelCoursePayment,
  changeCoursePaymentMethod,
} from '@/features/checkout/actions/checkout-actions';
import { usePaymentEvents } from '@/features/student/hooks/use-payment-events';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import type { PaymentInstructions, CheckoutMethodId, PaymentMethodMeta } from '@/lib/payment-engine/types';
import { formatIdr } from '@/lib/lms/format-price';
import {
  isPaymentSseTerminalStatus,
  type PaymentSseEvent,
} from '@/lib/payment/sse-types';
import { cn } from '@/lib/utils';
import type { PaymentStatus } from '@prisma/client';

export type PaymentDetailView = {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  amountIdr: number;
  checkoutMethod: string | null;
  instructions: PaymentInstructions | null;
  expiresAt: string | null;
  course: { slug: string; title: string };
  methods: PaymentMethodMeta[];
};

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mobile;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="gap-1"
      onClick={() => {
        navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
        toast.success(`${label} disalin`);
        window.setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? 'Tersalin' : 'Salin'}
    </Button>
  );
}

function Countdown({ expiresAt }: { expiresAt: string | null }) {
  const [left, setLeft] = useState<string>('');
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setLeft('Kedaluwarsa');
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${m}m ${s.toString().padStart(2, '0')}s`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);
  if (!expiresAt) return null;
  return <p className="text-xs text-muted-foreground">Berlaku hingga: {left}</p>;
}

function InstructionsPanel({
  instructions,
  isMobile,
}: {
  instructions: PaymentInstructions;
  isMobile: boolean;
}) {
  if (instructions.kind === 'qris') {
    return (
      <div className="space-y-3 text-center">
        {instructions.qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={instructions.qrUrl}
            alt="QRIS"
            className={cn('mx-auto rounded-xl border border-border bg-white p-3', isMobile ? 'w-48' : 'w-64')}
          />
        ) : (
          <p className="text-sm text-muted-foreground">QR belum tersedia.</p>
        )}
        {isMobile && instructions.qrUrl ? (
          <a
            href={instructions.qrUrl}
            download="qris-jepangku.png"
            className="text-sm font-semibold text-primary underline"
          >
            Simpan gambar QR
          </a>
        ) : null}
        <p className="text-lg font-extrabold text-brand-red">{formatIdr(instructions.amountIdr)}</p>
        <Countdown expiresAt={instructions.expiresAt ?? null} />
      </div>
    );
  }

  if (instructions.kind === 'va') {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Virtual Account {instructions.bank.toUpperCase()}
        </p>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-4 py-3">
          <span className="font-mono text-lg font-bold tracking-wide">{instructions.vaNumber}</span>
          <CopyButton value={instructions.vaNumber} label="Nomor VA" />
        </div>
        <p className="text-sm font-bold text-brand-red">{formatIdr(instructions.amountIdr)}</p>
        <Countdown expiresAt={instructions.expiresAt ?? null} />
      </div>
    );
  }

  if (instructions.kind === 'ewallet') {
    const preferDeepLink = isMobile && instructions.deepLink;
    return (
      <div className="space-y-3 text-center">
        {preferDeepLink ? (
          <Button asChild className="w-full">
            <a href={instructions.deepLink!} target="_blank" rel="noopener noreferrer">
              Buka aplikasi e-wallet
            </a>
          </Button>
        ) : null}
        {instructions.qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={instructions.qrUrl}
            alt="QR e-wallet"
            className={cn('mx-auto rounded-xl border bg-white p-3', isMobile ? 'w-48' : 'w-64')}
          />
        ) : null}
        {!preferDeepLink && instructions.deepLink ? (
          <a href={instructions.deepLink} className="text-sm font-semibold text-primary underline">
            Atau buka deeplink
          </a>
        ) : null}
        <p className="text-lg font-extrabold text-brand-red">{formatIdr(instructions.amountIdr)}</p>
        <Countdown expiresAt={instructions.expiresAt ?? null} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Kode bayar {instructions.store}
      </p>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-4 py-3">
        <span className="font-mono text-lg font-bold">{instructions.paymentCode}</span>
        <CopyButton value={instructions.paymentCode} label="Kode pembayaran" />
      </div>
      <p className="text-sm text-muted-foreground">
        Tunjukkan kode ini di kasir {instructions.store}. Pastikan nominal sesuai.
      </p>
      <p className="text-sm font-bold text-brand-red">{formatIdr(instructions.amountIdr)}</p>
      <Countdown expiresAt={instructions.expiresAt ?? null} />
    </div>
  );
}

export function PaymentDetailPage({ initial }: { initial: PaymentDetailView }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState(initial.status);
  const [busy, setBusy] = useState(false);
  const [showMethods, setShowMethods] = useState(false);

  const live = status === 'PENDING' || status === 'CHALLENGE';

  const onEvent = useCallback(
    (event: PaymentSseEvent) => {
      setStatus(event.status);
      if (event.status === 'PAID' && event.enrollmentStatus === 'ACTIVE') {
        toast.success('Pembayaran berhasil. Akses kursus aktif.');
        router.refresh();
        if (event.redirectPath) router.push(event.redirectPath);
        return;
      }
      if (isPaymentSseTerminalStatus(event.status) && event.status !== 'PAID') {
        toast.error('Status pembayaran berubah.');
        router.refresh();
      }
    },
    [router],
  );

  usePaymentEvents({
    paymentId: initial.paymentId,
    enabled: live,
    onEvent,
  });

  const handleCancel = async () => {
    setBusy(true);
    try {
      const result = await cancelCoursePayment(initial.paymentId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Pembayaran dibatalkan.');
      setStatus('CANCELED');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleChangeMethod = async (methodId: CheckoutMethodId) => {
    setBusy(true);
    try {
      const result = await changeCoursePaymentMethod({
        paymentId: initial.paymentId,
        methodId,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Metode diperbarui.');
      router.refresh();
      setShowMethods(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-12">
      <div>
        <Link
          href={STUDENT_ROUTES.kursusDetail(initial.course.slug)}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← {initial.course.title}
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold">Pembayaran</h1>
        <p className="mt-1 text-sm text-muted-foreground">Order {initial.orderId}</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div
            className={cn(
              'rounded-xl px-3 py-2 text-sm font-semibold',
              status === 'PAID' && 'bg-emerald-50 text-emerald-800',
              status === 'PENDING' && 'bg-amber-50 text-amber-900',
              (status === 'EXPIRED' || status === 'CANCELED' || status === 'FAILED' || status === 'DENIED') &&
                'bg-destructive/10 text-destructive',
              status === 'CHALLENGE' && 'bg-muted text-foreground',
            )}
          >
            Status: {status}
          </div>

          {initial.instructions ? (
            <InstructionsPanel instructions={initial.instructions} isMobile={isMobile} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Instruksi pembayaran tidak tersedia. Ganti metode untuk membuat transaksi baru.
            </p>
          )}
        </CardContent>
      </Card>

      {live ? (
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => setShowMethods((v) => !v)}>
            Ganti metode pembayaran
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={handleCancel}>
            Batalkan pembayaran
          </Button>
        </div>
      ) : null}

      {(status === 'EXPIRED' || status === 'CANCELED' || status === 'FAILED' || status === 'DENIED') && (
        <Button asChild className="w-full">
          <Link href={STUDENT_ROUTES.checkoutKursus(initial.course.slug)}>Buat pembayaran baru</Link>
        </Button>
      )}

      {showMethods ? (
        <ul className="grid gap-2">
          {initial.methods.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                disabled={busy || m.maintenance}
                onClick={() => handleChangeMethod(m.id)}
                className="w-full rounded-xl border border-border px-4 py-3 text-left font-semibold hover:border-primary"
              >
                {m.displayName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {status === 'PAID' ? (
        <Button asChild className="w-full">
          <Link href={STUDENT_ROUTES.kursusDetail(initial.course.slug)}>Mulai belajar</Link>
        </Button>
      ) : null}
    </div>
  );
}
