'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, Clock, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LEVEL_ACCENT } from '@/features/learning/components/courses-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { requestTryoutEnrollment } from '@/features/tryout/actions/tryout-actions';
import type { TryoutSessionView } from '@/features/student/lib/load-dashboard-extras';
import {
  ProgramPaymentPanel,
  type ProgramEnrollmentStatus,
} from '@/features/student/components/program-payment-panel';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { isFreeCourse } from '@/lib/lms/format-price';
import type { PaymentSettings } from '@/lib/payment/enrollment-payment-messages';
import { cn } from '@/lib/utils';

type TryoutSelectionPageProps = {
  sessions: TryoutSessionView[];
  paymentSettings: PaymentSettings;
  studentDisplayName: string | null;
};

function mapEnrollmentStatus(status: TryoutSessionView['enrollmentStatus']): ProgramEnrollmentStatus {
  if (status === 'ACTIVE' || status === 'PENDING') return status;
  return 'none';
}

export function TryoutSelectionPage({
  sessions,
  paymentSettings,
  studentDisplayName,
}: TryoutSelectionPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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

  const handleRequestEnrollment = () => {
    if (!activeSession) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const result = await requestTryoutEnrollment(activeSession.code);
        if (!result.ok) {
          toast.error(result.message);
          reject(new Error(result.message));
          return;
        }
        toast.success(
          result.status === 'ACTIVE'
            ? 'Akses tryout aktif. Selamat berlatih!'
            : 'Pendaftaran dikirim — menunggu verifikasi pembayaran.',
        );
        router.refresh();
        resolve();
      });
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-10 text-center sm:px-10"
        style={{ background: 'linear-gradient(135deg, #1E1B57 0%, #1a2d5a 60%, #2a1b4e 100%)' }}
      >
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
          { label: 'Format', value: 'MCQ + timer' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Pilih Sesi Ujian
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  {session.priceIdr > 0 && session.enrollmentStatus === 'PENDING' ? (
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
                    ? ` · Rp${session.priceIdr.toLocaleString('id-ID')}`
                    : session.priceIdr === 0
                      ? ' · Gratis'
                      : ''}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
          <BookOpen className="size-4 text-primary" />
          Petunjuk Tes
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>· Tiga bagian terpisah: MOJI GOI → BUNPOU DOKKAI → CHOKAI.</li>
          <li>· Bagian tanpa soal (mis. CHOKAI belum diisi) dilewati otomatis.</li>
          <li>· Setiap bagian diawali halaman petunjuk, lalu soal fokus per bagian.</li>
          <li>· Timer global — waktu habis otomatis tersimpan & terkirim.</li>
          <li>· Setelah selesai, lihat analisa jawaban benar/salah + penjelasan.</li>
          <li>· Kelulusan mengikuti standar JLPT (skor total + ambang per bagian).</li>
        </ul>
      </section>

      {activeSession && needsPayment ? (
        <ProgramPaymentPanel
          kind="tryout"
          productTitle={activeSession.title}
          productDetail={`${activeSession.code} · ${activeSession.level}`}
          priceIdr={activeSession.priceIdr}
          enrollmentStatus={mapEnrollmentStatus(activeSession.enrollmentStatus)}
          studentDisplayName={studentDisplayName}
          paymentSettings={paymentSettings}
          onRequestEnrollment={handleRequestEnrollment}
        />
      ) : null}

      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          disabled={!canStart || isPending}
          className="h-12 min-w-[220px] gap-2 px-8 text-base font-bold"
          onClick={() => {
            if (!canStart) return;
            router.push(STUDENT_ROUTES.tryoutExam(selectedSession));
          }}
        >
          Masuk Ujian
          <ChevronRight className="size-4" />
        </Button>
        {activeSession && !activeSession.isAccessible ? (
          <p className="text-xs font-medium text-amber-600">
            {activeSession.accessMessage ?? 'Tryout belum dapat diakses saat ini.'}
          </p>
        ) : needsPayment && hasQuestions ? (
          <p className="text-xs text-muted-foreground">
            Selesaikan pembayaran dan tunggu verifikasi admin untuk mengakses ujian ini.
          </p>
        ) : !hasQuestions ? (
          <p className="text-xs text-muted-foreground">
            Soal untuk sesi ini belum tersedia. Pastikan paket soal sudah READY dan terhubung ke
            sesi.
          </p>
        ) : (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {activeSession?.level} · Batas waktu {activeSession?.timeLimitMinutes ?? 120} menit
          </p>
        )}
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href={STUDENT_ROUTES.leaderboard}>
            <Trophy className="size-3.5" />
            Lihat Leaderboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
