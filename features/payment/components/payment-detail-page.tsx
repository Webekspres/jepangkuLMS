'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ban, CheckCircle2, Copy, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  cancelPayment,
  changePaymentMethod,
  resumeSnapCheckout,
  syncPaymentStatus,
} from '@/features/checkout/actions/checkout-actions';
import { PaymentMethodSelector } from '@/features/checkout/components/payment-method-selector';
import { openSnapPayUx, waitForWindowSnap } from '@/features/checkout/lib/snap-pay-ux';
import { PaymentTransactionDetail } from '@/features/payment/components/payment-transaction-detail';
import Script from 'next/script';
import { usePaymentEvents } from '@/features/student/hooks/use-payment-events';
import type {
  CheckoutMethodId,
  CheckoutProductType,
  PaymentInstructions,
  PaymentMethodMeta,
} from '@/lib/payment-engine/types';
import { formatIdr } from '@/lib/lms/format-price';
import {
  isPaymentSseTerminalStatus,
  type PaymentSseEvent,
} from '@/lib/payment/sse-types';
import { cn } from '@/lib/utils';
import type { PaymentStatus } from '@prisma/client';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export type PaymentDetailView = {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  amountIdr: number;
  checkoutMethod: string | null;
  methodLabel: string;
  instructions: PaymentInstructions | null;
  expiresAt: string | null;
  createdAt: string;
  paidAt: string | null;
  coverSrc: string;
  historyHref: string;
  product: {
    type: CheckoutProductType;
    key: string;
    title: string;
    backHref: string;
    successHref: string;
    successLabel: string;
  };
  methods: PaymentMethodMeta[];
  checkoutMode: 'snap' | 'core';
  hasSnapToken: boolean;
  midtransClientKey: string | null;
  midtransSnapUrl: string | null;
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Menunggu pembayaran',
  CHALLENGE: 'Sedang diverifikasi',
  PAID: 'Berhasil',
  DENIED: 'Ditolak',
  EXPIRED: 'Kedaluwarsa',
  CANCELED: 'Dibatalkan',
  FAILED: 'Gagal',
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
  return (
    <p className="text-sm font-medium text-muted-foreground">
      Berlaku hingga: <span className="tabular-nums text-foreground">{left}</span>
    </p>
  );
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
      <div className="space-y-4 text-center">
        <div className="mx-auto inline-block rounded-2xl border border-border bg-white p-4 shadow-sm">
          {instructions.qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={instructions.qrUrl}
              alt="QRIS"
              className={cn('mx-auto', isMobile ? 'w-52' : 'w-64')}
            />
          ) : (
            <p className="p-8 text-sm text-muted-foreground">QR belum tersedia.</p>
          )}
        </div>
        {isMobile && instructions.qrUrl ? (
          <a
            href={instructions.qrUrl}
            download="qris-jepangku.png"
            className="text-sm font-semibold text-primary underline"
          >
            Simpan gambar QR
          </a>
        ) : null}
        <p className="text-2xl font-extrabold text-brand-red">
          {formatIdr(instructions.amountIdr)}
        </p>
        <Countdown expiresAt={instructions.expiresAt ?? null} />
        <ol className="mx-auto max-w-sm space-y-1 text-left text-xs text-muted-foreground">
          <li>1. Buka aplikasi e-wallet atau mobile banking.</li>
          <li>2. Pilih bayar / scan QRIS.</li>
          <li>3. Pastikan nominal sesuai, lalu konfirmasi.</li>
        </ol>
      </div>
    );
  }

  if (instructions.kind === 'va') {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Virtual Account {instructions.bank.toUpperCase()}
        </p>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <span className="font-mono text-lg font-bold tracking-wider">{instructions.vaNumber}</span>
          <CopyButton value={instructions.vaNumber} label="Nomor VA" />
        </div>
        <p className="text-xl font-extrabold text-brand-red">{formatIdr(instructions.amountIdr)}</p>
        <Countdown expiresAt={instructions.expiresAt ?? null} />
        <ol className="space-y-1 text-xs text-muted-foreground">
          <li>1. Buka ATM / m-banking {instructions.bank.toUpperCase()}.</li>
          <li>2. Pilih Transfer → Virtual Account.</li>
          <li>3. Masukkan nomor VA di atas dan bayar sesuai nominal.</li>
        </ol>
      </div>
    );
  }

  if (instructions.kind === 'ewallet') {
    const preferDeepLink = isMobile && instructions.deepLink;
    return (
      <div className="space-y-4 text-center">
        {preferDeepLink ? (
          <Button asChild className="w-full">
            <a href={instructions.deepLink!} target="_blank" rel="noopener noreferrer">
              Buka aplikasi e-wallet
            </a>
          </Button>
        ) : null}
        {instructions.qrUrl ? (
          <div className="mx-auto inline-block rounded-2xl border border-border bg-white p-4 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={instructions.qrUrl}
              alt="QR e-wallet"
              className={cn(isMobile ? 'w-52' : 'w-64')}
            />
          </div>
        ) : null}
        {!preferDeepLink && instructions.deepLink ? (
          <a href={instructions.deepLink} className="text-sm font-semibold text-primary underline">
            Atau buka deeplink
          </a>
        ) : null}
        <p className="text-2xl font-extrabold text-brand-red">
          {formatIdr(instructions.amountIdr)}
        </p>
        <Countdown expiresAt={instructions.expiresAt ?? null} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Kode bayar {instructions.store}
      </p>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <span className="font-mono text-lg font-bold tracking-wider">{instructions.paymentCode}</span>
        <CopyButton value={instructions.paymentCode} label="Kode pembayaran" />
      </div>
      <p className="text-sm text-muted-foreground">
        Tunjukkan kode ini di kasir {instructions.store}. Pastikan nominal sesuai.
      </p>
      <p className="text-xl font-extrabold text-brand-red">{formatIdr(instructions.amountIdr)}</p>
      <Countdown expiresAt={instructions.expiresAt ?? null} />
    </div>
  );
}

export function PaymentDetailPage({
  initial,
  autoResumeSnap = false,
}: {
  initial: PaymentDetailView;
  autoResumeSnap?: boolean;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState(initial.status);
  const [busy, setBusy] = useState(false);
  const [showMethods, setShowMethods] = useState(false);
  const [offline, setOffline] = useState(false);
  const autoResumeStartedRef = useRef(false);

  const live = status === 'PENDING' || status === 'CHALLENGE';

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  const onEvent = useCallback(
    (event: PaymentSseEvent) => {
      setStatus(event.status);
      if (event.status === 'PAID' && event.enrollmentStatus === 'ACTIVE') {
        toast.success('Pembayaran berhasil. Akses sudah aktif.');
        router.refresh();
        return;
      }
      if (isPaymentSseTerminalStatus(event.status) && event.status !== 'PAID') {
        toast.error('Status pembayaran berubah.');
        router.push(initial.historyHref);
        router.refresh();
      }
    },
    [initial.historyHref, router],
  );

  usePaymentEvents({
    paymentId: initial.paymentId,
    enabled: live && !offline,
    onEvent,
    onConnectionIssue: () => {
      toast.message('Koneksi status terputus', {
        description: 'Mencoba menyambung ulang… atau tekan Cek status.',
      });
    },
  });

  useEffect(() => {
    if (!live || !offline) return;
    toast.message('Koneksi terputus', {
      description: 'Status akan diperbarui otomatis saat online kembali, atau tekan Cek status.',
    });
  }, [live, offline]);

  const handleCancel = async () => {
    setBusy(true);
    try {
      const result = await cancelPayment(initial.paymentId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Pembayaran dibatalkan.');
      setStatus('CANCELED');
      router.push(initial.historyHref);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleChangeMethod = async (methodId: CheckoutMethodId) => {
    setBusy(true);
    try {
      const result = await changePaymentMethod({
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

  const handleSync = useCallback(
    async (opts?: { silent?: boolean }) => {
      const result = await syncPaymentStatus(initial.paymentId);
      if (!result.ok) {
        if (!opts?.silent) toast.error(result.message);
        return result;
      }
      setStatus(result.status as PaymentStatus);
      if (result.status === 'PAID') {
        toast.success('Pembayaran berhasil. Akses sudah aktif.');
      } else if (!opts?.silent) {
        toast.message(`Status: ${STATUS_LABEL[result.status as PaymentStatus] ?? result.status}`);
      }
      router.refresh();
      return result;
    },
    [initial.paymentId, router],
  );

  const handleSyncClick = async () => {
    setBusy(true);
    try {
      await handleSync();
    } finally {
      setBusy(false);
    }
  };

  // SSE can miss updates (multi-instance without Redis). Poll Status API while waiting.
  useEffect(() => {
    if (!live || offline) return;
    const id = window.setInterval(() => {
      void handleSync({ silent: true });
    }, 5_000);
    return () => window.clearInterval(id);
  }, [handleSync, live, offline]);

  const handleResumeSnap = useCallback(async () => {
    setBusy(true);
    try {
      const canSnap =
        initial.checkoutMode === 'snap' &&
        Boolean(initial.midtransClientKey) &&
        Boolean(initial.midtransSnapUrl);
      if (!canSnap) {
        toast.error('Snap Midtrans belum dikonfigurasi.');
        return;
      }

      const ready = await waitForWindowSnap();
      if (!ready) {
        toast.error('Snap Midtrans belum siap. Muat ulang halaman, lalu coba lagi.');
        return;
      }

      const result = await resumeSnapCheckout(initial.paymentId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (result.alreadyPaid || !result.snapToken) {
        toast.success('Pembayaran berhasil. Akses sudah aktif.');
        setStatus('PAID');
        router.refresh();
        return;
      }
      await openSnapPayUx({
        snapToken: result.snapToken,
        paymentId: result.paymentId,
        callbacks: {
          onNavigateToPaymentDetail: () => {
            router.refresh();
          },
          onToast: (kind, message) => {
            if (kind === 'error') toast.error(message);
            else toast.message(message);
          },
          onReconcile: async () => {
            await handleSync({ silent: true });
          },
        },
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [
    handleSync,
    initial.checkoutMode,
    initial.midtransClientKey,
    initial.midtransSnapUrl,
    initial.paymentId,
    router,
  ]);

  useEffect(() => {
    if (!autoResumeSnap || !live || initial.checkoutMode !== 'snap') return;
    if (autoResumeStartedRef.current) return;
    autoResumeStartedRef.current = true;
    router.replace(STUDENT_ROUTES.pembayaran(initial.paymentId), { scroll: false });
    void handleResumeSnap();
  }, [
    autoResumeSnap,
    handleResumeSnap,
    initial.checkoutMode,
    initial.paymentId,
    live,
    router,
  ]);

  if (!live) {
    return (
      <PaymentTransactionDetail
        orderId={initial.orderId}
        status={status}
        amountIdr={initial.amountIdr}
        methodLabel={initial.methodLabel}
        createdAt={initial.createdAt}
        paidAt={initial.paidAt}
        coverSrc={initial.coverSrc}
        historyHref={initial.historyHref}
        product={{
          type: initial.product.type,
          key: initial.product.key,
          title: initial.product.title,
          successHref: initial.product.successHref,
          successLabel: initial.product.successLabel,
        }}
      />
    );
  }

  const isSnapMode = initial.checkoutMode === 'snap';
  const canLoadSnap =
    isSnapMode && Boolean(initial.midtransClientKey) && Boolean(initial.midtransSnapUrl);

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-12">
      {canLoadSnap ? (
        <Script
          id="midtrans-snap-detail"
          src={initial.midtransSnapUrl!}
          data-client-key={initial.midtransClientKey!}
          strategy="afterInteractive"
        />
      ) : null}

      <div>
        <Link
          href={initial.historyHref}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Riwayat pembayaran
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-extrabold md:text-3xl">Pembayaran</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">Order {initial.orderId}</p>
      </div>

      {offline ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
          <WifiOff className="size-4 shrink-0" />
          Offline — status realtime dijeda.
        </div>
      ) : null}

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="space-y-5 p-5">
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold',
              status === 'PENDING' &&
                'border-amber-500/30 bg-amber-500/10 text-foreground',
              status === 'CHALLENGE' && 'border-border bg-muted text-foreground',
            )}
          >
            <Loader2 className="size-4 shrink-0 animate-spin" />
            <span>{STATUS_LABEL[status] ?? status}</span>
          </div>

          {isSnapMode ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Selesaikan pembayaran di jendela Midtrans Snap. Status akses hanya berubah setelah
                konfirmasi server (webhook) — menutup popup tidak membatalkan pembayaran.
              </p>
              <Countdown expiresAt={initial.expiresAt} />
              <Button
                type="button"
                className="w-full"
                disabled={busy || !canLoadSnap}
                onClick={handleResumeSnap}
              >
                {busy ? 'Memproses…' : 'Lanjutkan di Midtrans Snap'}
              </Button>
            </div>
          ) : initial.instructions ? (
            <InstructionsPanel instructions={initial.instructions} isMobile={isMobile} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Instruksi pembayaran tidak tersedia. Ganti metode untuk membuat transaksi baru.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          className="w-full gap-2"
          onClick={handleSyncClick}
        >
          <RefreshCw className={cn('size-4', busy && 'animate-spin')} />
          Cek status
        </Button>
        {!isSnapMode ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className="w-full"
            onClick={() => setShowMethods((v) => !v)}
          >
            Ganti metode
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={busy || !canLoadSnap}
            className="w-full"
            onClick={handleResumeSnap}
          >
            Buka Snap lagi
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/5 sm:col-span-2"
          onClick={handleCancel}
        >
          <Ban className="size-4" />
          Batalkan pembayaran
        </Button>
      </div>

      {!isSnapMode && showMethods ? (
        <Card>
          <CardContent className="p-4">
            <PaymentMethodSelector
              methods={initial.methods}
              value={(initial.checkoutMethod as CheckoutMethodId) ?? null}
              onChange={handleChangeMethod}
              disabled={busy}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/** Lightweight skeleton for route transitions / method switch. */
export function PaymentDetailSkeleton() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-6 pb-12">
      <div className="h-8 w-40 rounded-lg bg-muted" />
      <div className="h-64 rounded-2xl bg-muted" />
      <div className="h-10 rounded-xl bg-muted" />
    </div>
  );
}
