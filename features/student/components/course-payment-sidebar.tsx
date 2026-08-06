'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Phone,
  Play,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { requestCourseCheckout, requestCourseEnrollment } from '@/features/learning/actions/learning-actions';
import { usePaymentEvents } from '@/features/student/hooks/use-payment-events';
import { formatIdr, isFreeCourse } from '@/lib/lms/format-price';
import { buildWhatsAppUrl } from '@/lib/admin-contact';
import {
  buildProgramConsultMessage,
  type PaymentSettings,
} from '@/lib/payment/enrollment-payment-messages';
import { isOpenMidtransPaymentStatus } from '@/lib/payment/payment-status';
import {
  isPaymentSseTerminalStatus,
  type PaymentSseEvent,
} from '@/lib/payment/sse-types';
import { cn } from '@/lib/utils';
import type { PaymentStatus } from '@prisma/client';
import { STUDENT_ROUTES } from './student-routes';

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

type SnapLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

const SNAP_READY_TIMEOUT_MS = 10_000;
const SNAP_POLL_MS = 50;

function waitForWindowSnap(timeoutMs = SNAP_READY_TIMEOUT_MS): Promise<boolean> {
  if (typeof window !== 'undefined' && window.snap) return Promise.resolve(true);

  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (window.snap) {
        resolve(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(false);
        return;
      }
      window.setTimeout(tick, SNAP_POLL_MS);
    };
    tick();
  });
}

type CoursePaymentSidebarProps = {
  courseSlug: string;
  courseTitle: string;
  lessonCount: number;
  priceIdr: number;
  studentDisplayName: string | null;
  enrollmentStatus: 'none' | 'PENDING' | 'ACTIVE';
  paymentStatus: PaymentStatus | null;
  paymentId?: string | null;
  progressPercent?: number;
  continueLessonSlug?: string | null;
  firstLessonSlug?: string;
  paymentSettings: PaymentSettings;
};

export function CoursePaymentSidebar({
  courseSlug,
  courseTitle,
  lessonCount,
  priceIdr,
  studentDisplayName: _studentDisplayName,
  enrollmentStatus,
  paymentStatus,
  paymentId: initialPaymentId = null,
  progressPercent = 0,
  continueLessonSlug,
  firstLessonSlug,
  paymentSettings,
}: CoursePaymentSidebarProps) {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  /** Set when checkout starts; falls back to server prop after refresh. */
  const [checkoutPaymentId, setCheckoutPaymentId] = useState<string | null>(null);
  const activePaymentId = checkoutPaymentId ?? initialPaymentId;
  /** SSE override; cleared when server `paymentStatus` prop changes. */
  const [ssePaymentStatus, setSsePaymentStatus] = useState<PaymentStatus | null>(null);
  const [trackedPaymentStatus, setTrackedPaymentStatus] = useState(paymentStatus);
  if (paymentStatus !== trackedPaymentStatus) {
    setTrackedPaymentStatus(paymentStatus);
    setSsePaymentStatus(null);
  }
  const [snapLoadStatus, setSnapLoadStatus] = useState<SnapLoadStatus>('loading');

  const isFree = isFreeCourse(priceIdr);
  const priceLabel = formatIdr(priceIdr);
  const isActive = enrollmentStatus === 'ACTIVE';
  const isMidtrans = paymentSettings.provider === 'midtrans';
  const isCoreCheckout = isMidtrans && paymentSettings.checkoutMode !== 'snap';
  const shouldLoadSnap =
    isMidtrans &&
    !isCoreCheckout &&
    Boolean(paymentSettings.midtransClientKey) &&
    Boolean(paymentSettings.midtransSnapUrl);
  const snapStatus: SnapLoadStatus = shouldLoadSnap ? snapLoadStatus : 'idle';
  const displayPaymentStatus = ssePaymentStatus ?? paymentStatus;
  const isAwaitingPayment =
    enrollmentStatus === 'PENDING' && isOpenMidtransPaymentStatus(displayPaymentStatus);

  const waConsultUrl = buildWhatsAppUrl(
    buildProgramConsultMessage({ kind: 'course', productTitle: courseTitle }),
  );

  const handlePaymentEvent = useCallback(
    (event: PaymentSseEvent) => {
      setSsePaymentStatus(event.status);

      if (event.status === 'PAID' && event.enrollmentStatus === 'ACTIVE') {
        toast.success('Pembayaran berhasil. Akses kursus sudah aktif.');
        router.refresh();
        if (event.redirectPath) {
          router.push(event.redirectPath);
        }
        return;
      }

      if (isPaymentSseTerminalStatus(event.status)) {
        toast.error('Pembayaran tidak berhasil. Silakan coba lagi atau hubungi admin.');
        router.refresh();
      }
    },
    [router],
  );

  usePaymentEvents({
    paymentId: activePaymentId,
    enabled: isMidtrans && isAwaitingPayment && Boolean(activePaymentId),
    onEvent: handlePaymentEvent,
  });

  const openSnap = async (snapToken: string) => {
    if (snapStatus === 'error') {
      toast.error('Script Snap Midtrans gagal dimuat. Muat ulang halaman lalu coba lagi.');
      return;
    }

    const ready = window.snap ? true : await waitForWindowSnap();
    if (!ready || !window.snap) {
      toast.error('Snap Midtrans belum siap. Coba lagi sebentar.');
      return;
    }

    if (snapStatus !== 'ready') setSnapLoadStatus('ready');

    window.snap.pay(snapToken, {
      onSuccess: () => {
        toast.success('Pembayaran diterima. Status kursus akan diperbarui otomatis.');
        router.refresh();
      },
      onPending: () => {
        toast.success('Pembayaran dibuat. Selesaikan pembayaran sesuai metode yang dipilih.');
        router.refresh();
      },
      onError: () => {
        toast.error('Midtrans mengembalikan error saat memproses pembayaran.');
        router.refresh();
      },
      onClose: () => {
        router.refresh();
      },
    });
  };

  const handleConfirmPayment = async () => {
    if (isCoreCheckout) {
      if (isAwaitingPayment && activePaymentId) {
        router.push(STUDENT_ROUTES.pembayaran(activePaymentId));
        return;
      }
      router.push(STUDENT_ROUTES.checkoutKursus(courseSlug));
      return;
    }

    if (!isMidtrans) {
      toast.error('Pembayaran online sedang tidak tersedia. Hubungi admin jika berlanjut.');
      return;
    }

    if (snapStatus === 'error') {
      toast.error('Script Snap Midtrans gagal dimuat. Muat ulang halaman lalu coba lagi.');
      return;
    }

    setIsRequesting(true);
    try {
      const result = await requestCourseCheckout(courseSlug);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (result.mode === 'free') {
        router.refresh();
        return;
      }
      if (result.mode === 'midtrans') {
        if (result.status === 'ACTIVE') {
          toast.success('Akses kursus sudah aktif.');
          router.refresh();
          return;
        }
        if (result.paymentId) {
          setCheckoutPaymentId(result.paymentId);
        }
        await openSnap(result.snapToken);
      } else {
        router.refresh();
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      {shouldLoadSnap ? (
        <Script
          id="midtrans-snap"
          src={paymentSettings.midtransSnapUrl!}
          data-client-key={paymentSettings.midtransClientKey!}
          strategy="afterInteractive"
          onLoad={() => {
            const ready = Boolean(window.snap);
            setSnapLoadStatus(ready ? 'ready' : 'error');
            if (process.env.NODE_ENV === 'development') {
              console.debug('[midtrans-snap] script onLoad', {
                hasWindowSnap: ready,
                src: paymentSettings.midtransSnapUrl,
              });
            }
          }}
          onError={() => {
            setSnapLoadStatus('error');
            if (process.env.NODE_ENV === 'development') {
              console.debug('[midtrans-snap] script onError', {
                src: paymentSettings.midtransSnapUrl,
              });
            }
          }}
        />
      ) : null}
      <Card className="shadow-sm">
        <CardContent className="space-y-5 p-5">
          {isActive ? (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Progress kamu
                </p>
                <p className="mt-1 text-3xl font-extrabold tabular-nums text-primary">
                  {progressPercent}%
                </p>
                <Progress value={Math.max(5, progressPercent)} className="mt-3 h-2.5" />
              </div>
              <Button asChild className="h-11 w-full gap-2">
                <Link
                  href={STUDENT_ROUTES.belajar(
                    courseSlug,
                    continueLessonSlug ?? firstLessonSlug ?? '',
                  )}
                >
                  <Play className="size-4" />
                  Lanjutkan belajar
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    'text-2xl font-extrabold',
                    isFree ? 'text-emerald-600' : 'text-brand-red',
                  )}
                >
                  {isFree ? 'GRATIS' : priceLabel}
                </span>
                {!isFree ? (
                  <span className="text-xs text-muted-foreground">sekali bayar</span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Akses seumur hidup · Update gratis
              </p>

              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-muted-foreground">
                <Shield className="size-4 shrink-0 text-emerald-600" />
                Garansi uang kembali 7 hari jika tidak puas
              </div>

              {isFree ? (
                <Button
                  className="h-11 w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  disabled={isRequesting}
                  onClick={async () => {
                    setIsRequesting(true);
                    try {
                      await requestCourseEnrollment(courseSlug);
                      router.refresh();
                    } finally {
                      setIsRequesting(false);
                    }
                  }}
                >
                  <Play className="size-4" />
                  {isRequesting ? 'Mendaftar…' : 'Mulai belajar gratis'}
                </Button>
              ) : (
                <>
                  {isAwaitingPayment ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-semibold">Menunggu penyelesaian pembayaran</p>
                      <p className="mt-1 text-xs text-amber-800">
                        {isCoreCheckout
                          ? `Status: ${displayPaymentStatus ?? 'PENDING'}. Selesaikan di halaman pembayaran — status diperbarui otomatis.`
                          : `Midtrans status saat ini: ${displayPaymentStatus ?? 'PENDING'}. Status akan diperbarui otomatis setelah pembayaran berhasil.`}
                      </p>
                    </div>
                  ) : null}

                  {!isMidtrans ? (
                    <p className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      Pembayaran online sedang tidak tersedia. Silakan coba lagi nanti.
                    </p>
                  ) : null}

                  {isMidtrans && snapStatus === 'error' ? (
                    <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      Script Snap Midtrans gagal dimuat. Muat ulang halaman, lalu coba lagi.
                    </p>
                  ) : null}

                  <Button
                    type="button"
                    className="h-11 w-full gap-2"
                    disabled={isRequesting || !isMidtrans || (isMidtrans && snapStatus === 'error')}
                    onClick={handleConfirmPayment}
                  >
                    <Shield className="size-4" />
                    {isRequesting
                      ? 'Memproses…'
                      : isMidtrans
                        ? isAwaitingPayment
                          ? 'Lanjutkan Pembayaran'
                          : isCoreCheckout
                            ? 'Beli Kursus'
                            : snapStatus === 'loading'
                              ? 'Menyiapkan Snap…'
                              : 'Bayar Sekarang'
                        : 'Pembayaran tidak tersedia'}
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-11 w-full gap-2 border-2 border-brand-red text-brand-red hover:bg-brand-red/5"
                  >
                    <a href={waConsultUrl} target="_blank" rel="noopener noreferrer">
                      <Phone className="size-4" />
                      Konsultasi Terlebih Dahulu
                    </a>
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Kursus ini meliputi
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Akses seumur hidup
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              {lessonCount} video pelajaran
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Sertifikat penyelesaian
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Dukungan instruktur via WA
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
