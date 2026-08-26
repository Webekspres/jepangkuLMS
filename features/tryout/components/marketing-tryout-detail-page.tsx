'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Shield,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEVEL_ACCENT } from '@/features/learning/components/courses-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import type { MarketingTryoutDetail } from '@/features/tryout/lib/load-marketing-tryout-detail';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { authEntryWithReturn } from '@/lib/auth/oauth-urls';
import { formatIdr, isFreeCourse } from '@/lib/lms/format-price';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';
import { cn } from '@/lib/utils';

const TRUST_ITEMS = [
  { icon: Shield, text: 'Simulasi sesuai level JLPT yang dipilih' },
  { icon: CheckCircle2, text: 'Timer, hasil skor, dan review jawaban' },
  { icon: CreditCard, text: 'Akses aktif setelah masuk & pembayaran dikonfirmasi' },
] as const;

type MarketingTryoutDetailPageProps = {
  session: MarketingTryoutDetail;
};

export function MarketingTryoutDetailPage({ session }: MarketingTryoutDetailPageProps) {
  const accent = JLPT_ACCENT[LEVEL_ACCENT[session.level]];
  const isFree = isFreeCourse(session.priceIdr);
  const priceLabel = formatIdr(session.priceIdr);
  const returnPath = STUDENT_ROUTES.tryout;
  const signUpHref = authEntryWithReturn(AUTH_ROUTES.signUp, returnPath);
  const signInHref = authEntryWithReturn(AUTH_ROUTES.signIn, returnPath);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar activeHref="/tryout" />

      <div className="border-b border-border bg-header backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3 md:px-8">
          <Link
            href="/kursus"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Katalog
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="line-clamp-1 text-sm font-medium text-foreground">{session.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
              <div className="relative h-52 w-full sm:h-64">
                <Image
                  src={session.coverSrc}
                  alt={session.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  unoptimized={isUnoptimizedImageSrc(session.coverSrc)}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-bold text-white',
                      accent.badge,
                    )}
                  >
                    {session.level}
                  </span>
                  <span className="rounded-md bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {session.phaseLabel}
                  </span>
                  <span className="rounded-md bg-brand-yellow px-2.5 py-1 text-xs font-bold text-brand-navy">
                    {priceLabel}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="size-4 text-primary" />
                Try Out JLPT
              </div>
              <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{session.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4 shrink-0 text-primary" />
                  {session.timeLimitMinutes} menit
                </span>
                {session.scheduledAtLabel ? (
                  <span className="flex items-center gap-1.5">
                    Jadwal: {session.scheduledAtLabel}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">Latihan terbuka</span>
                )}
              </div>
            </div>

            <div className="lg:hidden">
              <TryoutGuestSidebar
                isFree={isFree}
                priceLabel={priceLabel}
                signUpHref={signUpHref}
                signInHref={signInHref}
              />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-extrabold text-foreground">Tentang Sesi</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-base">
                {session.description}
              </p>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-extrabold text-foreground">Yang kamu dapatkan</h2>
              <ul className="mt-4 space-y-3">
                {TRUST_ITEMS.map((item) => (
                  <li key={item.text} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <item.icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="lg:sticky lg:top-24">
              <TryoutGuestSidebar
                isFree={isFree}
                priceLabel={priceLabel}
                signUpHref={signUpHref}
                signInHref={signInHref}
              />
            </div>
          </aside>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}

function TryoutGuestSidebar({
  isFree,
  priceLabel,
  signUpHref,
  signInHref,
}: {
  isFree: boolean;
  priceLabel: string;
  signUpHref: string;
  signInHref: string;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div>
        <p
          className={cn(
            'text-2xl font-extrabold',
            isFree ? 'text-emerald-600' : 'text-brand-red',
          )}
        >
          {isFree ? 'GRATIS' : priceLabel}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isFree
            ? 'Masuk akun untuk mulai tryout di dasbor siswa.'
            : 'Sekali bayar · akses sesi ini setelah masuk akun.'}
        </p>
      </div>

      <ul className="space-y-2">
        {TRUST_ITEMS.map((item) => (
          <li key={item.text} className="flex items-start gap-2 text-xs text-muted-foreground">
            <item.icon className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>

      <Button asChild className="h-11 w-full gap-2 font-bold" size="lg">
        <Link href={signUpHref}>
          <UserPlus className="size-4" />
          {isFree ? 'Daftar Gratis' : 'Daftar Sekarang'}
        </Link>
      </Button>
      <Button asChild variant="outline" className="h-11 w-full gap-2 font-bold">
        <Link href={signInHref}>{isFree ? 'Masuk' : 'Masuk untuk beli'}</Link>
      </Button>
    </div>
  );
}
