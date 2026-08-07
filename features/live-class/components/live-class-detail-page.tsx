'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  PlayCircle,
  Users,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { LEVEL_ACCENT } from '@/features/learning/components/courses-data';
import { resolveLiveClassCoverUrl } from '@/features/learning/lib/course-display';
import { requestLiveClassEnrollment, recordLiveClassSessionJoinAction } from '@/features/live-class/actions/live-class-actions';
import {
  resolveLiveSessionStatus,
  type LiveSessionStatus,
} from '@/features/live-class/lib/session-access';
import type {
  LiveClassDetailSession,
  LiveClassDetailView,
} from '@/features/live-class/lib/load-live-class-detail';
import { formatIdr, isFreeCourse } from '@/lib/lms/format-price';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<LiveSessionStatus, string> = {
  live: 'bg-emerald-500',
  upcoming: 'bg-blue-500',
  ended: 'bg-muted-foreground/40',
};

const JADWAL_SECTION_ID = 'jadwal-pertemuan';

function LiveClassJoinZoomButton({
  liveClassId,
  sessionId,
  meetingUrl,
  className,
  size = 'default',
}: {
  liveClassId: string;
  sessionId: string;
  meetingUrl: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}) {
  const [joining, setJoining] = useState(false);

  return (
    <Button
      type="button"
      size={size}
      className={className}
      disabled={joining}
      onClick={() => {
        void (async () => {
          setJoining(true);
          try {
            const result = await recordLiveClassSessionJoinAction({ liveClassId, sessionId });
            if (!result.ok) {
              toast.error(result.message);
              return;
            }
            window.open(result.meetingUrl || meetingUrl, '_blank', 'noopener,noreferrer');
          } finally {
            setJoining(false);
          }
        })();
      }}
    >
      <Video className="size-4 shrink-0" />
      {joining ? 'Membuka…' : 'Gabung via Zoom'}
      <ExternalLink className="size-3.5 shrink-0 opacity-70" />
    </Button>
  );
}

function SessionTimelineRow({
  session,
  liveClassId,
  isEnrolled,
  now,
  isLast,
}: {
  session: LiveClassDetailSession;
  liveClassId: string;
  isEnrolled: boolean;
  now: number;
  isLast: boolean;
}) {
  // Hitung ulang status secara real-time dari ISO (bukan snapshot SSR).
  const status = resolveLiveSessionStatus(
    new Date(session.scheduledAtISO),
    new Date(session.endsAtISO),
    new Date(now),
  );

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast ? (
        <span className="absolute left-1.75 top-5 h-full w-px bg-border" aria-hidden />
      ) : null}
      <span
        className={cn(
          'relative mt-1.5 size-3.5 shrink-0 rounded-full ring-4 ring-background',
          STATUS_DOT[status],
        )}
      >
        {status === 'live' ? (
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/70" />
        ) : null}
      </span>

      <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{session.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarClock className="size-3.5 text-blue-500" />
                {session.dateLabel}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 text-emerald-500" />
                {session.timeLabel}
              </span>
            </p>
          </div>
          {status === 'live' ? (
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
              Berlangsung
            </span>
          ) : status === 'ended' ? (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Selesai
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
              Akan datang
            </span>
          )}
        </div>

        {!isEnrolled ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            Daftar kelas untuk mengakses sesi ini.
          </p>
        ) : status === 'live' ? (
          session.meetingUrl ? (
            <LiveClassJoinZoomButton
              liveClassId={liveClassId}
              sessionId={session.id}
              meetingUrl={session.meetingUrl}
              size="sm"
              className="mt-3 h-9 w-full animate-pulse gap-2 bg-emerald-600 hover:bg-emerald-700 hover:animate-none"
            />
          ) : (
            <Button disabled size="sm" variant="outline" className="mt-3 h-9 w-full">
              Link meeting belum tersedia
            </Button>
          )
        ) : status === 'ended' ? (
          session.recordingUrl ? (
            <Button asChild size="sm" variant="outline" className="mt-3 h-9 w-full gap-2">
              <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer">
                <PlayCircle className="size-4" />
                Tonton Rekaman
              </a>
            </Button>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Rekaman belum tersedia.</p>
          )
        ) : (
          <Button disabled size="sm" variant="outline" className="mt-3 h-auto min-h-9 w-full gap-2 whitespace-normal py-2 text-left">
            <CalendarClock className="size-4 shrink-0" />
            <span className="min-w-0 wrap-break-word">
              {session.dateLabel} · {session.timeLabel}
            </span>
          </Button>
        )}
      </div>
    </li>
  );
}

function EnrolledAccessCard({
  liveClassId,
  sessions,
  now,
}: {
  liveClassId: string;
  sessions: LiveClassDetailSession[];
  now: number;
}) {
  const liveSession = useMemo(() => {
    return sessions.find((session) => {
      const status = resolveLiveSessionStatus(
        new Date(session.scheduledAtISO),
        new Date(session.endsAtISO),
        new Date(now),
      );
      return status === 'live';
    });
  }, [sessions, now]);

  const nextSession = useMemo(() => {
    if (liveSession) return liveSession;
    return sessions.find((session) => {
      const status = resolveLiveSessionStatus(
        new Date(session.scheduledAtISO),
        new Date(session.endsAtISO),
        new Date(now),
      );
      return status === 'upcoming';
    });
  }, [sessions, now, liveSession]);

  return (
    <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-700">Terdaftar</p>
          <p className="text-xs text-emerald-700/80">Akses jadwal & meeting sudah aktif.</p>
        </div>
      </div>

      {nextSession ? (
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {liveSession ? 'Sedang berlangsung' : 'Sesi berikutnya'}
          </p>
          <p className="mt-1 wrap-break-word text-sm font-bold text-foreground">{nextSession.title}</p>
          <p className="mt-1 wrap-break-word text-xs text-muted-foreground">
            {nextSession.dateLabel} · {nextSession.timeLabel}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Semua sesi sudah selesai. Cek jadwal untuk rekaman.
        </p>
      )}

      {liveSession?.meetingUrl ? (
        <LiveClassJoinZoomButton
          liveClassId={liveClassId}
          sessionId={liveSession.id}
          meetingUrl={liveSession.meetingUrl}
          className="h-11 w-full min-w-0 animate-pulse gap-2 whitespace-normal bg-emerald-600 hover:bg-emerald-700 hover:animate-none"
        />
      ) : (
        <Button asChild variant="outline" className="h-11 w-full min-w-0 gap-2">
          <a href={`#${JADWAL_SECTION_ID}`}>
            <CalendarClock className="size-4 shrink-0" />
            Lihat jadwal
          </a>
        </Button>
      )}
    </div>
  );
}

function LiveClassSidebarActions({
  liveClass,
  isPending,
  onEnroll,
  now,
}: {
  liveClass: LiveClassDetailView;
  isPending: boolean;
  onEnroll: () => Promise<void>;
  now: number;
}) {
  if (liveClass.enrollmentStatus === 'ACTIVE') {
    return (
      <EnrolledAccessCard liveClassId={liveClass.id} sessions={liveClass.sessions} now={now} />
    );
  }

  if (liveClass.accessMessage) {
    return (
      <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Lock className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Pendaftaran ditutup</p>
            <p className="wrap-break-word text-xs text-muted-foreground">{liveClass.accessMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isFreeCourse(liveClass.priceIdr)) {
    return (
      <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="min-w-0">
          <p className="text-2xl font-extrabold text-emerald-600">GRATIS</p>
          <p className="mt-1 wrap-break-word text-xs text-muted-foreground">
            Daftar sekali — akses langsung aktif setelah pendaftaran.
          </p>
        </div>
        <Button
          onClick={() => void onEnroll()}
          disabled={isPending || liveClass.isFull}
          size="lg"
          className="h-11 w-full min-w-0 gap-2"
        >
          {liveClass.isFull ? 'Kelas Penuh' : isPending ? 'Memproses…' : 'Daftar Gratis'}
        </Button>
      </div>
    );
  }

  const useMidtrans =
    liveClass.paymentSettings.provider === 'midtrans';
  const priceLabel = formatIdr(liveClass.priceIdr);
  const isAwaitingPayment =
    liveClass.enrollmentStatus === 'PENDING' && Boolean(liveClass.pendingPaymentId);

  if (!useMidtrans) {
    return (
      <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <p className="text-2xl font-extrabold text-brand-red">{priceLabel}</p>
        <p className="text-sm text-muted-foreground">
          Pembayaran online sedang tidak tersedia. Silakan coba lagi nanti atau hubungi admin.
        </p>
      </div>
    );
  }

  const checkoutHref = liveClass.pendingPaymentId
    ? STUDENT_ROUTES.pembayaran(liveClass.pendingPaymentId, { resume: true })
    : STUDENT_ROUTES.checkoutLiveClass(liveClass.id);
  return (
    <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div>
        <p className="text-2xl font-extrabold text-brand-red">{priceLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Bayar online — akses aktif otomatis setelah pembayaran berhasil.
        </p>
      </div>
      {isAwaitingPayment ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-foreground">
          <p className="font-semibold">Menunggu penyelesaian pembayaran</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Selesaikan di halaman pembayaran — status diperbarui otomatis.
          </p>
        </div>
      ) : null}
      <Button
        asChild
        size="lg"
        className="h-11 w-full"
        disabled={liveClass.isFull || Boolean(liveClass.accessMessage)}
      >
        <Link href={checkoutHref}>
          {liveClass.isFull
            ? 'Kelas Penuh'
            : isAwaitingPayment || liveClass.pendingPaymentId
              ? 'Lanjutkan pembayaran'
              : 'Bayar sekarang'}
        </Link>
      </Button>
    </div>
  );
}

export function LiveClassDetailPage({
  liveClass,
  studentDisplayName: _studentDisplayName,
}: {
  liveClass: LiveClassDetailView;
  studentDisplayName: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());

  // Tick agar status sesi berpindah otomatis (upcoming → live → ended).
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const accent = JLPT_ACCENT[LEVEL_ACCENT[liveClass.level]];
  const fillPct = Math.min(
    100,
    Math.round((liveClass.filledSlots / Math.max(1, liveClass.maxSlots)) * 100),
  );

  const handleEnroll = () =>
    new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const result = await requestLiveClassEnrollment(liveClass.id);
        if (!result.ok) {
          toast.error(result.message);
          reject(new Error(result.message));
          return;
        }
        toast.success(
          result.status === 'PENDING'
            ? 'Permintaan terkirim. Selesaikan pembayaran Midtrans.'
            : 'Berhasil terdaftar! Selamat belajar 🎉',
        );
        router.refresh();
        resolve();
      });
    });

  const coverSrc = resolveLiveClassCoverUrl(liveClass.coverImageUrl);

  const sidebarProps = {
    liveClass,
    isPending,
    onEnroll: handleEnroll,
    now,
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-8 pb-10">
      <Link
        href="/dashboard/live-class"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Semua Live Class
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Cover — fixed height like course detail */}
          <div className="relative w-full overflow-hidden rounded-2xl border border-border shadow-sm">
            <div className="relative h-52 w-full sm:h-64">
              <Image
                src={coverSrc}
                alt={liveClass.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 800px"
                unoptimized={isUnoptimizedImageSrc(coverSrc)}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                <span
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-bold text-white',
                    accent.badge,
                  )}
                >
                  {liveClass.level}
                </span>
                <span className="rounded-md bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {liveClass.category}
                </span>
                <span className="rounded-md bg-brand-yellow px-2.5 py-1 text-xs font-bold text-brand-navy">
                  {formatIdr(liveClass.priceIdr)}
                </span>
              </div>
            </div>
          </div>

          {/* Title + meta below cover */}
          <div className="min-w-0">
            <h1 className="wrap-break-word text-2xl font-extrabold text-foreground sm:text-3xl">
              {liveClass.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold uppercase text-foreground">
                  {liveClass.senseiName.charAt(0)}
                </span>
                <span className="min-w-0 wrap-break-word">
                  {liveClass.senseiName}
                  {liveClass.senseiLevel ? (
                    <span className="text-muted-foreground/70"> · {liveClass.senseiLevel}</span>
                  ) : null}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4 shrink-0 text-primary" />
                {liveClass.filledSlots}/{liveClass.maxSlots} peserta
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-4 shrink-0 text-primary" />
                {liveClass.sessionCount} pertemuan
              </span>
            </div>
            <div className="mt-4 max-w-xs">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full',
                    liveClass.isFull
                      ? 'bg-destructive'
                      : fillPct > 75
                        ? 'bg-amber-400'
                        : 'bg-emerald-400',
                  )}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mobile: CTA after meta */}
          <div className="min-w-0 lg:hidden">
            <LiveClassSidebarActions {...sidebarProps} />
          </div>

          {/* Tentang Program */}
          <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-foreground">Tentang Program</h2>
            <p className="mt-3 wrap-break-word whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-base">
              {liveClass.description}
            </p>
          </section>

          {/* Session timeline */}
          <section id={JADWAL_SECTION_ID} className="min-w-0 scroll-mt-24">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="min-w-0 text-lg font-extrabold text-foreground">Jadwal Pertemuan</h2>
              <span className="shrink-0 text-sm text-muted-foreground">{liveClass.sessionCount} sesi</span>
            </div>

            {liveClass.sessions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                Jadwal pertemuan belum tersedia. Cek kembali nanti ya.
              </p>
            ) : (
              <ol className="min-w-0 pl-1">
                {liveClass.sessions.map((session, index) => (
                  <SessionTimelineRow
                    key={session.id}
                    session={session}
                    liveClassId={liveClass.id}
                    isEnrolled={liveClass.isEnrolled}
                    now={now}
                    isLast={index === liveClass.sessions.length - 1}
                  />
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Desktop sticky sidebar */}
        <aside className="hidden min-w-0 lg:col-span-1 lg:block">
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <LiveClassSidebarActions {...sidebarProps} />
          </div>
        </aside>
      </div>
    </div>
  );
}
