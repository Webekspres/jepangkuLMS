'use client';

import Link from 'next/link';
import { CheckCircle2, CreditCard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEVEL_ACCENT } from '@/features/learning/components/courses-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import type { TryoutSessionView } from '@/features/student/lib/load-dashboard-extras';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { formatIdr } from '@/lib/lms/format-price';
import type { PaymentSettings } from '@/lib/payment/enrollment-payment-messages';
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

export function TryoutAccessPanel({ session, paymentSettings }: TryoutAccessPanelProps) {
  const accent = JLPT_ACCENT[LEVEL_ACCENT[session.level]];
  const isAwaitingPayment =
    session.enrollmentStatus === 'PENDING' && Boolean(session.pendingPaymentId);
  const useMidtrans = paymentSettings.provider === 'midtrans';
  const priceLabel = formatIdr(session.priceIdr);
  const checkoutHref = session.pendingPaymentId
    ? STUDENT_ROUTES.pembayaran(session.pendingPaymentId, { resume: true })
    : STUDENT_ROUTES.checkoutTryout(session.code);

  if (!useMidtrans) {
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <p className="text-2xl font-extrabold text-brand-red">{priceLabel}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pembayaran online sedang tidak tersedia. Silakan coba lagi nanti atau hubungi admin.
        </p>
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

      {isAwaitingPayment ? (
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
          {isAwaitingPayment || session.pendingPaymentId ? 'Lanjutkan pembayaran' : 'Bayar sekarang'}
        </Link>
      </Button>
    </div>
  );
}
