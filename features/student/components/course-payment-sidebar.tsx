'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  Phone,
  Play,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { requestCourseEnrollment } from '@/features/learning/actions/learning-actions';
import { formatIdr, isFreeCourse } from '@/lib/lms/format-price';
import { buildWhatsAppUrl } from '@/lib/admin-contact';
import { cn } from '@/lib/utils';
import { STUDENT_ROUTES } from './student-routes';

type PaymentSettings = { bankName: string; accountName: string; accountNumber: string };

type CoursePaymentSidebarProps = {
  courseSlug: string;
  courseTitle: string;
  lessonCount: number;
  priceIdr: number;
  studentDisplayName: string | null;
  enrollmentStatus: 'none' | 'PENDING' | 'ACTIVE';
  progressPercent?: number;
  continueLessonSlug?: string | null;
  firstLessonSlug?: string;
  paymentSettings: PaymentSettings;
};

function buildPaymentConfirmMessage(input: {
  courseTitle: string;
  priceLabel: string;
  studentName: string | null;
  paymentSettings: PaymentSettings;
}) {
  const name = input.studentName?.trim() || '[nama Anda]';
  return [
    `Halo, saya ingin konfirmasi pembayaran untuk kursus "${input.courseTitle}" (${input.priceLabel}).`,
    '',
    `Nama: ${name}`,
    `No. Rekening tujuan: ${input.paymentSettings.bankName} ${input.paymentSettings.accountNumber} a/n ${input.paymentSettings.accountName}`,
    '',
    'Mohon konfirmasi. Terima kasih!',
  ].join('\n');
}

function buildConsultMessage(courseTitle: string) {
  return `Halo, saya ingin konsultasi tentang kursus "${courseTitle}" sebelum mendaftar. Terima kasih!`;
}

export function CoursePaymentSidebar({
  courseSlug,
  courseTitle,
  lessonCount,
  priceIdr,
  studentDisplayName,
  enrollmentStatus,
  progressPercent = 0,
  continueLessonSlug,
  firstLessonSlug,
  paymentSettings,
}: CoursePaymentSidebarProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const isFree = isFreeCourse(priceIdr);
  const priceLabel = formatIdr(priceIdr);
  const isActive = enrollmentStatus === 'ACTIVE';
  const isPending = enrollmentStatus === 'PENDING';

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(paymentSettings.accountNumber).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!isFree && !isPending && !isActive) {
      setIsRequesting(true);
      try {
        await requestCourseEnrollment(courseSlug);
        router.refresh();
      } finally {
        setIsRequesting(false);
      }
    }
    window.open(waConfirmUrl, '_blank', 'noopener,noreferrer');
  };

  const waConfirmUrl = buildWhatsAppUrl(
    buildPaymentConfirmMessage({ courseTitle, priceLabel, studentName: studentDisplayName, paymentSettings }),
  );
  const waConsultUrl = buildWhatsAppUrl(buildConsultMessage(courseTitle));

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
                <Progress value={progressPercent} className="mt-3" />
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
                  {isPending ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-semibold">Menunggu verifikasi admin</p>
                      <p className="mt-1 text-xs text-amber-800">
                        Setelah transfer, kirim bukti via WhatsApp. Admin akan mengaktifkan akses
                        kursus setelah pembayaran dikonfirmasi.
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Transfer via {paymentSettings.bankName}
                    </p>
                    <div className="space-y-2 rounded-xl bg-muted/60 p-3.5">
                      <div>
                        <p className="text-xs text-muted-foreground">Nama Rekening</p>
                        <p className="text-sm font-semibold text-foreground">
                          {paymentSettings.accountName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nomor Rekening</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-base font-bold tracking-widest text-foreground">
                            {paymentSettings.accountNumber}
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={handleCopyAccount}
                          >
                            {copied ? (
                              <>
                                <CheckCircle2 className="size-3.5" />
                                Tersalin
                              </>
                            ) : (
                              <>
                                <Copy className="size-3.5" />
                                Salin
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="border-t border-border pt-2">
                        <p className="text-xs text-muted-foreground">Jumlah Transfer</p>
                        <p className="text-sm font-bold text-brand-red">{priceLabel}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="h-11 w-full gap-2 bg-[#25d366] hover:bg-[#128c7e]"
                    disabled={isRequesting}
                    onClick={handleConfirmPayment}
                  >
                    <MessageCircle className="size-4" />
                    {isRequesting ? 'Memproses…' : 'Konfirmasi Pembayaran'}
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
