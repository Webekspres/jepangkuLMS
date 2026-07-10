'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEVEL_ACCENT } from '@/features/learning/components/courses-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import type { TryoutSessionView } from '@/features/student/lib/load-dashboard-extras';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { cn } from '@/lib/utils';

type TryoutSelectionPageProps = {
  sessions: TryoutSessionView[];
};

export function TryoutSelectionPage({ sessions }: TryoutSelectionPageProps) {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState(sessions[0]?.code ?? '');

  const activeSession = useMemo(
    () => sessions.find((session) => session.code === selectedSession),
    [sessions, selectedSession],
  );

  const canStart = Boolean(
    activeSession && activeSession.questionCount > 0 && activeSession.isAccessible,
  );

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
          <li>· Skor minimal kelulusan simulasi: 60%.</li>
        </ul>
      </section>

      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          disabled={!canStart}
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
        ) : !canStart ? (
          <p className="text-xs text-muted-foreground">
            Soal untuk sesi ini belum tersedia. Coba sesi Fase 1 N5.
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
