'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Flame, Target, Trophy, Zap } from 'lucide-react';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getLeaderboardUserContext,
  LEADERBOARD_PODIUM,
  LEADERBOARD_TOP_10,
  type LeaderboardEntry,
} from './student-leaderboard-data';
import { STUDENT_ROUTES } from './student-routes';

const PODIUM_META = [
  {
    crown: '🥈',
    blockClass: 'h-16 bg-muted border-border',
    rankClass: 'text-muted-foreground',
    ringClass: 'ring-muted-foreground/30',
  },
  {
    crown: '👑',
    blockClass: 'h-24 border-primary/30 bg-primary/10',
    rankClass: 'text-primary',
    ringClass: 'ring-brand-yellow/70',
  },
  {
    crown: '🥉',
    blockClass: 'h-12 border-amber-500/30 bg-amber-500/10',
    rankClass: 'text-amber-700',
    ringClass: 'ring-amber-500/40',
  },
] as const;

function LeaderboardAvatar({
  entry,
  size = 'md',
  highlight = false,
}: {
  entry: LeaderboardEntry;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
}) {
  const sizeClass =
    size === 'lg' ? 'size-14 text-sm' : size === 'md' ? 'size-10 text-xs' : 'size-8 text-[10px]';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border-2 bg-secondary font-bold text-secondary-foreground ring-2',
        sizeClass,
        highlight ? 'ring-brand-yellow/70' : 'ring-border',
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
  entry: LeaderboardEntry;
  meta: (typeof PODIUM_META)[number];
  center?: boolean;
  delay: number;
}) {
  return (
    <div className={cn('flex flex-col items-center', center ? 'flex-[1.2]' : 'flex-1')}>
      <span className="mb-1 text-lg">{meta.crown}</span>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay, type: 'spring', stiffness: 280 }}
      >
        <LeaderboardAvatar entry={entry} size={center ? 'lg' : 'md'} highlight={center} />
      </motion.div>
      <p className={cn('mt-2 max-w-full truncate text-center text-xs font-bold', meta.rankClass)}>
        {entry.name}
        {entry.isYou && ' (Kamu)'}
      </p>
      <p className="mt-0.5 flex items-center gap-0.5 text-[11px] text-muted-foreground">
        <Zap className="size-3 text-brand-yellow" />
        {formatDisplayNumber(entry.xp)} XP
      </p>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{ delay: delay + 0.1, duration: 0.5 }}
        className={cn(
          'mt-3 flex w-full items-start justify-center rounded-t-xl border pt-2',
          meta.blockClass,
        )}
      >
        <span className={cn('text-2xl font-black tabular-nums', meta.rankClass)}>
          {entry.rank}
        </span>
      </motion.div>
    </div>
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
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
          {entry.level} · {entry.streakDays}d streak
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums text-foreground">
        <Zap className="size-3.5 text-brand-yellow" />
        {formatDisplayNumber(entry.xp)}
      </div>
    </motion.div>
  );
}

export function StudentLeaderboardPage() {
  const context = getLeaderboardUserContext();

  return (
    <div className="space-y-6 pb-8">
      {/* Header + stats */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-primary uppercase">
              Peringkat global
            </p>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-foreground sm:text-3xl">
              <Trophy className="size-7 text-brand-yellow" />
              Leaderboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Top 10 siswa berdasarkan total XP — update setiap hari.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[16rem]">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[11px] text-muted-foreground">Rank kamu</p>
              <p className="text-2xl font-black text-primary">#{context.rank}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[11px] text-muted-foreground">Total siswa</p>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {context.totalLearnersLabel}+
              </p>
            </div>
          </div>
        </div>

        {context.xpToNext > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-yellow/25 bg-brand-yellow/10 px-3 py-2 text-sm">
            <Target className="size-4 text-amber-700" />
            <span className="text-foreground">
              <strong>{formatDisplayNumber(context.xpToNext)} XP</strong> lagi untuk salip{' '}
              <strong>{context.nextRankName}</strong>
            </span>
          </div>
        )}
      </section>

      {/* Podium */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">Podium Top 3</h2>
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
            Top 10
          </span>
        </div>

        <div className="border-b border-border bg-muted/20 px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-lg items-end justify-center gap-2 sm:gap-4">
            {LEADERBOARD_PODIUM.map((entry, index) => (
              <PodiumSlot
                key={entry.rank}
                entry={entry}
                meta={PODIUM_META[index]!}
                center={index === 1}
                delay={0.1 + index * 0.08}
              />
            ))}
          </div>
        </div>

        {/* Rank 4–10 */}
        <div className="p-4 sm:p-5">
          <p className="mb-3 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Rank 4 – 10
          </p>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {LEADERBOARD_TOP_10.slice(3).map((entry, index) => (
              <LeaderboardRow key={entry.rank} entry={entry} index={index} />
            ))}
          </div>
        </div>

        <div className="border-t border-border px-4 py-4 sm:px-5">
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href={STUDENT_ROUTES.achievements}>
              <Flame className="size-4" />
              Lihat koleksi badge
            </Link>
          </Button>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Data demo — ranking akan diambil dari Core XP service setelah auth siap.
      </p>
    </div>
  );
}
