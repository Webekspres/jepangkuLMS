'use client';

import { useEffect, useState, useTransition } from 'react';
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
import { requestLiveClassEnrollment } from '@/features/live-class/actions/live-class-actions';
import {
  resolveLiveSessionStatus,
  type LiveSessionStatus,
} from '@/features/live-class/lib/session-access';
import type {
  LiveClassDetailSession,
  LiveClassDetailView,
} from '@/features/live-class/lib/load-live-class-detail';
import {
  ProgramPaymentPanel,
  type ProgramEnrollmentStatus,
} from '@/features/student/components/program-payment-panel';
import { formatIdr, isFreeCourse } from '@/lib/lms/format-price';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<LiveSessionStatus, string> = {
  live: 'bg-emerald-500',
  upcoming: 'bg-blue-500',
  ended: 'bg-muted-foreground/40',
};

function SessionTimelineRow({
  session,
  isEnrolled,
  now,
  isLast,
}: {
  session: LiveClassDetailSession;
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
        <span className="absolute left-[7px] top-5 h-full w-px bg-border" aria-hidden />
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
            <Button
              asChild
              size="sm"
              className="mt-3 h-9 w-full animate-pulse gap-2 bg-emerald-600 hover:bg-emerald-700 hover:animate-none"
            >
              <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                <Video className="size-4" />
                Gabung via Zoom
                <ExternalLink className="size-3.5 opacity-70" />
              </a>
            </Button>
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
          <Button disabled size="sm" variant="outline" className="mt-3 h-9 w-full gap-2">
            <CalendarClock className="size-4" />
            {session.dateLabel} · {session.timeLabel}
          </Button>
        )}
      </div>
    </li>
  );
}

export function LiveClassDetailPage({
  liveClass,
  studentDisplayName,
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
          result.status === 'ACTIVE'
            ? 'Berhasil terdaftar! Selamat belajar 🎉'
            : 'Pendaftaran dikirim — menunggu verifikasi pembayaran.',
        );
        router.refresh();
        resolve();
      });
    });

  const enrollmentStatus: ProgramEnrollmentStatus =
    liveClass.enrollmentStatus === 'ACTIVE' || liveClass.enrollmentStatus === 'PENDING'
      ? liveClass.enrollmentStatus
      : 'none';
  const coverSrc = resolveLiveClassCoverUrl(liveClass.coverImageUrl);

  return (
    <div className="space-y-8 pb-10">
      <Link
        href="/dashboard/live-class"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Semua Live Class
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border">
        <div className="absolute inset-0">
          <Image
            src={coverSrc}
            alt={liveClass.title}
            fill
            priority
            className="object-cover"
            unoptimized={isUnoptimizedImageSrc(coverSrc)}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/55 to-black/30 backdrop-blur-[1px]" />
        </div>

        <div className="relative z-10 flex flex-col gap-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-md px-2.5 py-1 text-xs font-bold text-white', accent.badge)}>
              {liveClass.level}
            </span>
            <span className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {liveClass.category}
            </span>
            <span className="rounded-md bg-brand-yellow px-2.5 py-1 text-xs font-bold text-brand-navy">
              {formatIdr(liveClass.priceIdr)}
            </span>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-extrabold leading-tight text-white">
              {liveClass.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">
              {liveClass.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
            <span className="flex items-center gap-1.5">
              <span className="grid size-7 place-items-center rounded-full bg-white/15 text-xs font-bold uppercase">
                {liveClass.senseiName.charAt(0)}
              </span>
              {liveClass.senseiName}
              {liveClass.senseiLevel ? (
                <span className="text-white/60">· {liveClass.senseiLevel}</span>
              ) : null}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {liveClass.filledSlots}/{liveClass.maxSlots} peserta
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-4" />
              {liveClass.sessionCount} pertemuan
            </span>
          </div>

          <div className="max-w-xs">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className={cn(
                  'h-full rounded-full',
                  liveClass.isFull ? 'bg-destructive' : fillPct > 75 ? 'bg-amber-400' : 'bg-emerald-400',
                )}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Action area */}
      <section className="space-y-4">
        {liveClass.enrollmentStatus === 'ACTIVE' ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700 ">
                Kamu sudah terdaftar di program ini 🎉
              </p>
            </div>
          </div>
        ) : isFreeCourse(liveClass.priceIdr) ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Program gratis</p>
                <p className="text-xs text-muted-foreground">
                  Daftar sekali — akses langsung aktif setelah pendaftaran.
                </p>
              </div>
              <Button
                onClick={() => void handleEnroll()}
                disabled={isPending || liveClass.isFull}
                size="lg"
                className="gap-2"
              >
                {liveClass.isFull ? 'Kelas Penuh' : isPending ? 'Memproses…' : 'Daftar Gratis'}
              </Button>
            </div>
          </div>
        ) : (
          <ProgramPaymentPanel
            kind="live-class"
            productTitle={liveClass.title}
            productDetail={liveClass.id}
            priceIdr={liveClass.priceIdr}
            enrollmentStatus={enrollmentStatus}
            studentDisplayName={studentDisplayName}
            paymentSettings={liveClass.paymentSettings}
            paymentLink={liveClass.paymentLink}
            onRequestEnrollment={handleEnroll}
            disabled={liveClass.isFull}
            disabledMessage={liveClass.isFull ? 'Kelas sudah penuh.' : undefined}
          />
        )}
      </section>

      {/* Session timeline */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground">Jadwal Pertemuan</h2>
          <span className="text-sm text-muted-foreground">{liveClass.sessionCount} sesi</span>
        </div>

        {liveClass.sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
            Jadwal pertemuan belum tersedia. Cek kembali nanti ya.
          </p>
        ) : (
          <ol className="pl-1">
            {liveClass.sessions.map((session, index) => (
              <SessionTimelineRow
                key={session.id}
                session={session}
                isEnrolled={liveClass.isEnrolled}
                now={now}
                isLast={index === liveClass.sessions.length - 1}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
