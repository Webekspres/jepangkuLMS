'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, CreditCard, MessageCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LEVEL_ACCENT } from '@/features/learning/components/courses-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { ManualBankTransferCard } from '@/features/student/components/manual-bank-transfer-card';
import type { TryoutSessionView } from '@/features/student/lib/load-dashboard-extras';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { requestTryoutEnrollment } from '@/features/tryout/actions/tryout-actions';
import { buildWhatsAppUrl } from '@/lib/admin-contact';
import { formatIdr } from '@/lib/lms/format-price';
import {
  buildProgramPaymentConfirmMessage,
  type PaymentSettings,
} from '@/lib/payment/enrollment-payment-messages';
import { cn } from '@/lib/utils';

const TRUST_ITEMS = [
  { icon: Shield, text: 'Simulasi sesuai level JLPT yang dipilih' },
  { icon: CheckCircle2, text: 'Timer, hasil skor, dan review jawaban' },
  { icon: CreditCard, text: 'Akses aktif setelah pembayaran dikonfirmasi' },
] as const;

type TryoutAccessPanelProps = {
  session: TryoutSessionView;
  paymentSettings: PaymentSettings;
  studentDisplayName: string | null;
};

export function TryoutAccessPanel({
  session,
  paymentSettings,
  studentDisplayName,
}: TryoutAccessPanelProps) {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const accent = JLPT_ACCENT[LEVEL_ACCENT[session.level]];
  const isPending = session.enrollmentStatus === 'PENDING';
  const useMidtrans = paymentSettings.provider === 'midtrans';
  const isManual = paymentSettings.provider === 'manual';
  const priceLabel = formatIdr(session.priceIdr);
  const checkoutHref = session.pendingPaymentId
    ? STUDENT_ROUTES.pembayaran(session.pendingPaymentId)
    : STUDENT_ROUTES.checkoutTryout(session.code);
  const waConfirmUrl = buildWhatsAppUrl(
    buildProgramPaymentConfirmMessage({
      kind: 'tryout',
      productTitle: session.title,
      productDetail: session.code,
      priceLabel,
      studentName: studentDisplayName,
      paymentSettings,
    }),
  );

  if (!useMidtrans && !isManual) {
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <p className="text-2xl font-extrabold text-brand-red">{priceLabel}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pembayaran online sedang tidak tersedia. Silakan coba lagi nanti atau hubungi admin.
        </p>
      </div>
    );
  }

  if (isManual) {
    return (
      <div className="w-full space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white',
              accent.badge,
            )}
          >
            {session.level}
          </span>
          <p className="text-sm font-semibold text-foreground">{session.title}</p>
        </div>

        <div>
          <p className="text-2xl font-extrabold text-brand-red">{priceLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Transfer manual — admin mengaktifkan akses setelah konfirmasi.
          </p>
        </div>

        {isPending ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-foreground">
            <p className="font-semibold">Menunggu verifikasi admin</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Setelah transfer, kirim bukti via WhatsApp.
            </p>
          </div>
        ) : null}

        <ManualBankTransferCard paymentSettings={paymentSettings} priceLabel={priceLabel} />

        <ul className="space-y-2">
          {TRUST_ITEMS.map((item) => (
            <li key={item.text} className="flex items-start gap-2 text-xs text-muted-foreground">
              <item.icon className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          className="h-11 w-full gap-2 bg-[#25d366] hover:bg-[#128c7e]"
          size="lg"
          disabled={isRequesting}
          onClick={() => {
            void (async () => {
              if (!isPending) {
                setIsRequesting(true);
                try {
                  const result = await requestTryoutEnrollment(session.code);
                  if (!result.ok) {
                    toast.error(result.message);
                    return;
                  }
                  router.refresh();
                } finally {
                  setIsRequesting(false);
                }
              }
              window.open(waConfirmUrl, '_blank', 'noopener,noreferrer');
            })();
          }}
        >
          <MessageCircle className="size-4" />
          {isRequesting ? 'Memproses…' : 'Konfirmasi Pembayaran'}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white',
            accent.badge,
          )}
        >
          {session.level}
        </span>
        <p className="text-sm font-semibold text-foreground">{session.title}</p>
      </div>

      <div>
        <p className="text-2xl font-extrabold text-brand-red">{priceLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">Sekali bayar · akses sesi ini</p>
      </div>

      {isPending ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-foreground">
          <p className="font-semibold">Menunggu penyelesaian pembayaran</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Selesaikan di halaman pembayaran — status diperbarui otomatis.
          </p>
        </div>
      ) : null}

      <ul className="space-y-2">
        {TRUST_ITEMS.map((item) => (
          <li key={item.text} className="flex items-start gap-2 text-xs text-muted-foreground">
            <item.icon className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>

      <Button asChild className="h-11 w-full gap-2" size="lg">
        <Link href={checkoutHref}>
          <CreditCard className="size-4" />
          {isPending || session.pendingPaymentId ? 'Lanjutkan pembayaran' : 'Bayar sekarang'}
        </Link>
      </Button>
    </div>
  );
}
