'use client';

import { motion } from 'motion/react';
import { Award, Target, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getLeaderboardPodiumSlots,
  getLeaderboardUserContext,
} from '@/features/student/lib/leaderboard-helpers';
import type { StudentLeaderboardEntry } from '@/features/student/types/student-core-data';
import { useStudentCoreData } from './student-core-data-context';
import { STUDENT_ROUTES } from './student-routes';

const PODIUM_META = [
  {
    crown: '🥈',
    podiumHeight: 'h-20 sm:h-24',
    rankClass: 'text-slate-600 dark:text-slate-400 font-bold',
    ringClass: 'ring-slate-300/50',
    blockClass: 'border-slate-200 bg-linear-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700 shadow-md shadow-slate-500/5',
  },
  {
    crown: '👑',
    podiumHeight: 'h-28 sm:h-36',
    rankClass: 'text-amber-600 dark:text-brand-yellow font-black',
    ringClass: 'ring-brand-yellow/85',
    blockClass: 'border-brand-yellow/30 bg-linear-to-b from-amber-50/80 to-amber-100/90 dark:from-amber-950/20 dark:to-amber-900/30 dark:border-brand-yellow/20 shadow-xl shadow-amber-500/10 ring-2 ring-brand-yellow/10',
  },
  {
    crown: '🥉',
    podiumHeight: 'h-14 sm:h-20',
    rankClass: 'text-amber-800 dark:text-amber-600 font-bold',
    ringClass: 'ring-amber-500/50',
    blockClass: 'border-amber-300/30 bg-linear-to-b from-amber-50/50 to-amber-100/50 dark:from-amber-950/10 dark:to-amber-900/15 dark:border-amber-900/20 shadow-md shadow-amber-600/5',
  },
] as const;

function LeaderboardAvatar({
  entry,
  size = 'md',
  highlight = false,
  ringClass,
}: {
  entry: StudentLeaderboardEntry;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
  ringClass?: string;
}) {
  const sizeClass =
    size === 'lg' ? 'size-14 sm:size-16 text-sm' : size === 'md' ? 'size-10 text-xs' : 'size-8 text-[10px]';

  const finalRing = ringClass ?? (highlight ? 'ring-brand-yellow/70' : 'ring-border');

  if (entry.imageUrl) {
    return (
      <Image
        src={entry.imageUrl}
        alt=""
        width={size === 'lg' ? 64 : size === 'md' ? 40 : 32}
        height={size === 'lg' ? 64 : size === 'md' ? 40 : 32}
        className={cn(
          'shrink-0 rounded-full border-2 object-cover ring-2',
          sizeClass,
          finalRing,
          entry.isYou && 'border-primary',
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border-2 bg-secondary font-bold text-secondary-foreground ring-2',
        sizeClass,
        finalRing,
        entry.isYou && 'border-primary bg-primary/10 text-primary',
      )}
    >
      {entry.avatar}
    </div>
  );
}

function PodiumSlot({
  entry,
  meta,
  center = false,
  delay,
}: {
  entry: StudentLeaderboardEntry;
  meta: (typeof PODIUM_META)[number];
  center?: boolean;
  delay: number;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center',
        center ? 'w-[38%] max-w-[9rem] sm:max-w-[10rem]' : 'w-[31%] max-w-[7.5rem]',
      )}
    >
      <span className="mb-1 text-base sm:text-lg">{meta.crown}</span>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay, type: 'spring', stiffness: 280 }}
      >
        <LeaderboardAvatar entry={entry} size={center ? 'lg' : 'md'} highlight={center} ringClass={meta.ringClass} />
      </motion.div>
      <p className={cn('mt-2 max-w-full truncate text-center text-[11px] font-bold sm:text-xs', meta.rankClass)}>
        {entry.name}
        {entry.isYou && ' (Kamu)'}
      </p>
      {entry.badgeTitle ? (
        <p className="mt-0.5 max-w-full truncate text-center text-[10px] font-semibold text-primary">
          {entry.badgeTitle}
        </p>
      ) : null}
      <p className="mt-0.5 flex items-center gap-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
        <Zap className="size-3 text-brand-yellow" />
        {formatDisplayNumber(entry.points)} poin
      </p>
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.45 }}
        style={{ transformOrigin: 'bottom' }}
        className={cn(
          'mt-3 flex w-full items-start justify-center rounded-t-xl border pt-2 sm:pt-3',
          meta.podiumHeight,
          meta.blockClass,
        )}
      >
        <span className={cn('text-xl font-black tabular-nums sm:text-2xl', meta.rankClass)}>
          {entry.rank}
        </span>
      </motion.div>
    </div>
  );
}

function LeaderboardRow({ entry, index }: { entry: StudentLeaderboardEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 + index * 0.04 }}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5',
        entry.isYou ? 'border border-primary/25 bg-primary/5' : 'bg-muted/30',
      )}
    >
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
          entry.isYou ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground',
        )}
      >
        {entry.rank}
      </span>
      <LeaderboardAvatar entry={entry} size="sm" highlight={entry.isYou} />
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold', entry.isYou ? 'text-primary' : 'text-foreground')}>
          {entry.name}
          {entry.isYou && (
            <span className="ml-1 text-[10px] font-bold uppercase text-primary">· Kamu</span>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {entry.badgeTitle ? (
            <span className="font-medium text-primary">{entry.badgeTitle}</span>
          ) : (
            entry.levelLabel
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums text-foreground">
        <Zap className="size-3.5 text-brand-yellow" />
        {formatDisplayNumber(entry.points)}
      </div>
    </motion.div>
  );
}

export function StudentLeaderboardPage() {
  const core = useStudentCoreData();
  const top10 = core.leaderboardTop10;
  const context = getLeaderboardUserContext(top10, {
    lmsRank: core.lmsRank,
    lmsPoints: core.lmsPoints,
    leaderboardTotal: core.leaderboardTotal,
  });
  const podiumSlots = getLeaderboardPodiumSlots(top10);
  const rest = top10.filter((entry) => entry.rank > 3);
  const podiumTitle =
    top10.length >= 3 ? 'Podium Top 3' : top10.length === 2 ? 'Podium Top 2' : 'Peringkat #1';

  return (
    <div className="space-y-6 pb-8">
      <section
        className="relative overflow-hidden rounded-2xl shadow-lg text-white"
        style={{ background: 'linear-gradient(135deg, #1E1B57 0%, #14123c 60%, #1e1136 100%)' }}
      >
        {/* Glow effects */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-yellow/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-8 left-8 h-40 w-40 rounded-full bg-primary/20 blur-[60px]" />

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 z-10">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wider text-brand-yellow uppercase">
              Peringkat Pelajar
            </p>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
              <Trophy className="size-7 text-brand-yellow drop-shadow-[0_2px_8px_rgba(250,204,21,0.4)] animate-pulse" />
              Papan Peringkat
            </h1>
            <p className="mt-1.5 text-xs text-white/70 sm:text-sm">
              10 Pelajar terbaik dengan poin tertinggi. Kumpulkan poin dengan menyelesaikan pelajaran dan try out!
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[16rem]">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Rank Anda</p>
              <p className="text-2xl font-black text-brand-yellow">
                {context.rank != null ? `#${context.rank}` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Total Pelajar</p>
              <p className="text-2xl font-black text-white">
                {context.totalLearnersLabel}
              </p>
            </div>
          </div>
        </div>

        {context.pointsToNext > 0 && context.nextRankName && (
          <div className="relative border-t border-white/10 px-5 py-3 sm:px-6 flex items-center gap-2 text-xs sm:text-sm text-white/80 bg-black/10 z-10">
            <Target className="size-4 text-brand-yellow animate-pulse" />
            <span>
              Tinggal <strong>{formatDisplayNumber(context.pointsToNext)} poin</strong> lagi untuk menyalip <strong>{context.nextRankName}</strong>! Semangat!
            </span>
          </div>
        )}
      </section>

      {top10.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
            <h2 className="font-bold text-foreground">{podiumTitle}</h2>
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
              Top {Math.min(10, top10.length)}
            </span>
          </div>

          <div className="border-b border-border bg-linear-to-b from-muted/30 to-background px-3 py-6 sm:px-6">
            <div
              className={cn(
                'mx-auto flex max-w-xl items-end justify-center gap-1 sm:gap-3',
                top10.length === 1 && 'max-w-xs',
              )}
            >
              {podiumSlots.map((slot, index) => (
                <PodiumSlot
                  key={slot.entry.userId}
                  entry={slot.entry}
                  meta={PODIUM_META[slot.metaIndex]!}
                  center={slot.center}
                  delay={0.1 + index * 0.08}
                />
              ))}
            </div>
          </div>

          {rest.length > 0 && (
            <div className="p-4 sm:p-5">
              <p className="mb-3 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Rank 4 – 10
              </p>
              <div className="space-y-2">
                {rest.map((entry, index) => (
                  <LeaderboardRow key={entry.userId} entry={entry} index={index} />
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border px-4 py-4 sm:px-5">
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href={STUDENT_ROUTES.achievements}>
                <Award className="size-4" />
                Lihat koleksi badge
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Leaderboard masih kosong — selesaikan lesson atau quiz untuk mengumpulkan poin!
          </p>
        </section>
      )}

      {core.totalXp > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          Total XP kamu (level): {formatDisplayNumber(core.totalXp)} · Poin LMS: {formatDisplayNumber(core.lmsPoints)}
        </p>
      ) : null}
    </div>
  );
}
