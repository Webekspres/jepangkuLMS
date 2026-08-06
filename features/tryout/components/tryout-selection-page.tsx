'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEVEL_ACCENT } from '@/features/learning/components/courses-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import type { TryoutSessionView } from '@/features/student/lib/load-dashboard-extras';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { TryoutAccessPanel } from '@/features/tryout/components/tryout-access-panel';
import { formatIdr, isFreeCourse } from '@/lib/lms/format-price';
import type { PaymentSettings } from '@/lib/payment/enrollment-payment-messages';
import { cn } from '@/lib/utils';

type TryoutSelectionPageProps = {
  sessions: TryoutSessionView[];
  paymentSettings: PaymentSettings;
  studentDisplayName: string | null;
};

function TryoutEnterExamCard({
  session,
  canStart,
  hasQuestions,
  onStart,
}: {
  session: TryoutSessionView;
  canStart: boolean;
  hasQuestions: boolean;
  onStart: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">{session.title}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {session.level} · Batas waktu {session.timeLimitMinutes} menit
        </p>
        {isFreeCourse(session.priceIdr) ? (
          <p className="mt-2 text-lg font-extrabold text-emerald-600">GRATIS</p>
        ) : session.enrollmentStatus === 'ACTIVE' ? (
          <p className="mt-2 text-xs font-medium text-emerald-600">Akses aktif</p>
        ) : null}
      </div>

      <Button
        size="lg"
        disabled={!canStart}
        className="h-11 w-full gap-2 font-bold"
        onClick={onStart}
      >
        Masuk Ujian
        <ChevronRight className="size-4" />
      </Button>

      {!session.isAccessible ? (
        <p className="text-xs font-medium text-amber-600">
          {session.accessMessage ?? 'Tryout belum dapat diakses saat ini.'}
        </p>
      ) : !hasQuestions ? (
        <p className="text-xs text-muted-foreground">
          Soal untuk sesi ini belum tersedia. Pastikan paket soal sudah READY dan terhubung ke sesi.
        </p>
      ) : null}
    </div>
  );
}

export function TryoutSelectionPage({
  sessions,
  paymentSettings,
  studentDisplayName,
}: TryoutSelectionPageProps) {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState(sessions[0]?.code ?? '');

  const activeSession = useMemo(
    () => sessions.find((session) => session.code === selectedSession),
    [sessions, selectedSession],
  );

  const hasQuestions = Boolean(activeSession && activeSession.questionCount > 0);
  const isEnrolled =
    !activeSession ||
    isFreeCourse(activeSession.priceIdr) ||
    activeSession.enrollmentStatus === 'ACTIVE';
  const needsPayment =
    Boolean(activeSession && activeSession.priceIdr > 0) &&
    activeSession?.enrollmentStatus !== 'ACTIVE';

  const canStart = Boolean(
    activeSession && hasQuestions && activeSession.isAccessible && isEnrolled,
  );

  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-2xl bg-brand-hero-navy px-6 py-10 text-center sm:px-10">
        <div className="absolute inset-0">
          <Image
            src="/assets/Cover-JLPT-TryOut.webp"
            alt="Ilustrasi simulasi ujian JLPT"
            fill
            sizes="(max-width: 640px) 100vw, 80rem"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-brand-hero-navy/85" />
        </div>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-red/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-8 left-8 h-32 w-32 rounded-full bg-primary/20 blur-[60px]" />
        <div className="relative z-10">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-white/50 uppercase">
            Olimpiade intensif JLPT
          </p>
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold text-white">
            Simulasi Ujian JLPT
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
            Pilih sesi simulasi. Setiap sesi terkunci ke satu level JLPT. Bagian MOJI GOI, BUNPOU
            DOKKAI, dan CHOKAI dikerjakan terpisah — seperti ujian resmi.
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Musim simulasi', value: `${sessions.length}` },
          { label: 'Durasi standar', value: '120 menit' },
          { label: 'Format', value: 'Pilihan Ganda + timer' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Pilih Sesi Ujian
            </h2>
            <div className="flex flex-col gap-3">
              {sessions.map((session) => {
                const active = selectedSession === session.code;
                const accent = JLPT_ACCENT[LEVEL_ACCENT[session.level]];
                const enrolled =
                  isFreeCourse(session.priceIdr) || session.enrollmentStatus === 'ACTIVE';
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedSession(session.code)}
                    className={cn(
                      'rounded-xl border-2 p-4 text-left transition-all',
                      active
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/30',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground">{session.title}</p>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white',
                          accent.badge,
                        )}
                      >
                        {session.level}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                          session.isStrictTimeBound
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-emerald-500/15 text-emerald-600',
                        )}
                      >
                        {session.isStrictTimeBound ? 'Terjadwal' : 'Latihan'}
                      </span>
                      {session.priceIdr > 0 &&
                      session.enrollmentStatus === 'PENDING' &&
                      session.pendingPaymentId ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">
                          Menunggu bayar
                        </span>
                      ) : null}
                      {enrolled && session.priceIdr > 0 ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                          Terdaftar
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {session.isStrictTimeBound && session.scheduledAt
                        ? new Date(session.scheduledAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Tersedia sekarang'}
                    </p>
                    <p className="mt-2 text-[10px] font-medium text-muted-foreground">
                      {session.questionCount > 0
                        ? `${session.questionCount} soal`
                        : 'Soal menyusul'}
                      {session.priceIdr > 0
                        ? ` · ${formatIdr(session.priceIdr)}`
                        : session.priceIdr === 0
                          ? ' · Gratis'
                          : ''}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
              <BookOpen className="size-4 shrink-0 text-primary" />
              Petunjuk Tes
            </h2>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>· Tiga bagian: MOJI GOI → BUNPOU DOKKAI → CHOKAI.</li>
              <li>· Bagian tanpa soal dilewati otomatis.</li>
              <li>· Setiap bagian diawali petunjuk, lalu soal fokus.</li>
              <li>· Timer global — waktu habis otomatis tersimpan.</li>
              <li>· Setelah selesai: analisa benar/salah + penjelasan.</li>
              <li>· Kelulusan mengikuti standar JLPT.</li>
            </ul>
          </section>

          {activeSession && needsPayment ? (
            <TryoutAccessPanel
              session={activeSession}
              paymentSettings={paymentSettings}
              studentDisplayName={studentDisplayName}
            />
          ) : activeSession ? (
            <TryoutEnterExamCard
              session={activeSession}
              canStart={canStart}
              hasQuestions={hasQuestions}
              onStart={() => {
                if (!canStart) return;
                router.push(STUDENT_ROUTES.tryoutExam(selectedSession));
              }}
            />
          ) : null}

          <Button asChild variant="outline" className="h-10 w-full gap-2">
            <Link href={STUDENT_ROUTES.leaderboard}>
              <Trophy className="size-3.5" />
              Lihat Leaderboard
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
