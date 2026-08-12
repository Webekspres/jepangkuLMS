'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
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
import { requestCourseEnrollment } from '@/features/learning/actions/learning-actions';
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
  const activePaymentId = initialPaymentId;
  /** SSE override; cleared when server `paymentStatus` prop changes. */
  const [ssePaymentStatus, setSsePaymentStatus] = useState<PaymentStatus | null>(null);
  const [trackedPaymentStatus, setTrackedPaymentStatus] = useState(paymentStatus);
  if (paymentStatus !== trackedPaymentStatus) {
    setTrackedPaymentStatus(paymentStatus);
    setSsePaymentStatus(null);
  }

  const isFree = isFreeCourse(priceIdr);
  const priceLabel = formatIdr(priceIdr);
  const isActive = enrollmentStatus === 'ACTIVE';
  const isMidtrans = paymentSettings.provider === 'midtrans';
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

  const handleConfirmPayment = () => {
    if (!isMidtrans) {
      toast.error('Pembayaran online sedang tidak tersedia. Hubungi admin jika berlanjut.');
      return;
    }
    if (isAwaitingPayment && activePaymentId) {
      router.push(STUDENT_ROUTES.pembayaran(activePaymentId, { resume: true }));
      return;
    }
    router.push(STUDENT_ROUTES.checkoutKursus(courseSlug));
  };

  return (
    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
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
                        Status: {displayPaymentStatus ?? 'PENDING'}. Selesaikan di halaman
                        pembayaran — status diperbarui otomatis.
                      </p>
                    </div>
                  ) : null}

                  {!isMidtrans ? (
                    <p className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      Pembayaran online sedang tidak tersedia. Silakan coba lagi nanti.
                    </p>
                  ) : null}

                  <Button
                    type="button"
                    className="h-11 w-full gap-2"
                    disabled={!isMidtrans}
                    onClick={handleConfirmPayment}
                  >
                    <Shield className="size-4" />
                    {!isMidtrans
                      ? 'Pembayaran tidak tersedia'
                      : isAwaitingPayment
                        ? 'Lanjutkan Pembayaran'
                        : 'Beli Kursus'}
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
