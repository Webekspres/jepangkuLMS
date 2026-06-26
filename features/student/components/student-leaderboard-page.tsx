'use client';

import { motion } from 'motion/react';
import {
  Award,
  ChevronUp,
  Crown,
  Flame,
  Gem,
  Shield,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDisplayNumber, LANDING_HERO_GRID_STYLE } from '@/features/marketing/components/landing-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getLeaderboardPodiumSlots,
  getLeaderboardUserContext,
} from '@/features/student/lib/leaderboard-helpers';
import type { StudentLeaderboardEntry } from '@/features/student/types/student-core-data';
import { useStudentCoreData } from './student-core-data-context';
import { STUDENT_ROUTES } from './student-routes';

// ─── Podium tier metadata ──────────────────────────────────────────────────────

const PODIUM_META = [
  // metaIndex 0 → Rank 2 (Silver / Shirogane)
  {
    crown: <Shield className="size-4 text-slate-300" />,
    crownEmoji: '🥈',
    rankLabel: 'Shirogane',
    rankLabelEn: 'Silver',
    podiumHeight: 'h-16 sm:h-20',
    rankClass: 'text-slate-300 dark:text-slate-300 font-extrabold text-3xl sm:text-4xl',
    glowClass: 'shadow-slate-400/20',
    ringClass: 'ring-slate-400/60 border-slate-400/40',
    cardClass:
      'border-slate-400/30 bg-linear-to-br from-slate-800/90 to-slate-900/95 dark:from-slate-800/90 dark:to-slate-900/95',
    podiumClass:
      'border-t-2 border-slate-400/40 bg-linear-to-b from-slate-700/50 to-slate-800/60',
    avatarSize: 'size-14 sm:size-16 text-sm',
    scale: 'scale-95',
  },
  // metaIndex 1 → Rank 1 (Gold / Ougon)
  {
    crown: <Crown className="size-5 text-brand-yellow drop-shadow-[0_0_8px_rgba(248,231,28,0.8)]" />,
    crownEmoji: '👑',
    rankLabel: 'Ougon',
    rankLabelEn: 'Gold',
    podiumHeight: 'h-24 sm:h-32',
    rankClass: 'text-brand-yellow dark:text-brand-yellow font-black text-4xl sm:text-5xl drop-shadow-[0_0_12px_rgba(248,231,28,0.8)]',
    glowClass: 'shadow-brand-yellow/30',
    ringClass: 'ring-brand-yellow/70 border-brand-yellow/60',
    cardClass:
      'border-brand-yellow/40 bg-linear-to-br from-amber-900/60 via-amber-800/40 to-slate-900/95',
    podiumClass:
      'border-t-2 border-brand-yellow/50 bg-linear-to-b from-amber-800/40 to-amber-900/50',
    avatarSize: 'size-16 sm:size-20 text-base',
    scale: 'scale-105',
  },
  // metaIndex 2 → Rank 3 (Bronze / Akagane)
  {
    crown: <Gem className="size-4 text-amber-600" />,
    crownEmoji: '🥉',
    rankLabel: 'Akagane',
    rankLabelEn: 'Bronze',
    podiumHeight: 'h-10 sm:h-14',
    rankClass: 'text-amber-600 dark:text-amber-500 font-extrabold text-3xl sm:text-4xl',
    glowClass: 'shadow-amber-700/20',
    ringClass: 'ring-amber-600/50 border-amber-600/40',
    cardClass:
      'border-amber-700/30 bg-linear-to-br from-amber-950/80 to-slate-900/95',
    podiumClass:
      'border-t-2 border-amber-700/40 bg-linear-to-b from-amber-900/30 to-amber-950/40',
    avatarSize: 'size-12 sm:size-14 text-xs',
    scale: 'scale-90',
  },
] as const;

// ─── BadgeTitlePill ─────────────────────────────────────────────────────────────

/** Premium pill for equipped badge titles. All titles get Legendary amber treatment
 *  on the leaderboard — they earned a title, that alone signals elite status. */
function BadgeTitlePill({
  title,
  size = 'default',
}: {
  title: string;
  size?: 'default' | 'sm';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border',
        'bg-amber-500/10 border-amber-500/35 dark:bg-amber-400/10 dark:border-amber-400/30',
        'font-bold tracking-widest uppercase leading-none',
        '[text-shadow:0_1px_3px_rgba(0,0,0,0.4)]',
        size === 'sm'
          ? 'px-1.5 py-0.5 text-[8px] text-amber-700 dark:text-amber-300'
          : 'px-2 py-0.5 text-[9px] text-amber-700 dark:text-amber-300',
      )}
    >
      <Flame
        className={cn(
          'shrink-0',
          size === 'sm' ? 'size-2' : 'size-2.5',
          'text-amber-500 dark:text-amber-400',
        )}
      />
      {title}
    </span>
  );
}

// ─── LeaderboardAvatar ──────────────────────────────────────────────────────────

function LeaderboardAvatar({
  entry,
  sizeClass,
  ringClass,
}: {
  entry: StudentLeaderboardEntry;
  sizeClass: string;
  ringClass: string;
}) {
  if (entry.imageUrl) {
    return (
      <Image
        src={entry.imageUrl}
        alt=""
        width={80}
        height={80}
        className={cn(
          'shrink-0 rounded-full border-2 object-cover ring-2',
          sizeClass,
          ringClass,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border-2 font-black ring-2',
        sizeClass,
        ringClass,
        entry.isYou
          ? 'bg-brand-red/30 text-white border-brand-red/60'
          : 'bg-slate-700 text-slate-200 border-slate-600',
      )}
    >
      {entry.avatar}
    </div>
  );
}

// ─── PodiumSlot ─────────────────────────────────────────────────────────────────

function PodiumSlot({
  entry,
  meta,
  center,
  delay,
}: {
  entry: StudentLeaderboardEntry;
  meta: (typeof PODIUM_META)[number];
  center: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 20 }}
      className={cn(
        'flex flex-col items-center justify-end',
        center
          ? 'w-[40%] min-w-[9rem] max-w-[11rem] z-10'
          : 'w-[30%] min-w-[7rem] max-w-[9rem]',
      )}
    >
      {/* Unified Champion Card */}
      <div
        className={cn(
          'relative w-full rounded-2xl border flex flex-col items-center justify-between',
          'shadow-xl backdrop-blur-sm',
          meta.glowClass,
          meta.cardClass,
          center ? 'pt-5 px-3' : 'pt-4 px-2.5',
        )}
      >
        {/* Rank label banner */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest uppercase border',
              center
                ? 'bg-brand-yellow/20 border-brand-yellow/50 text-brand-yellow'
                : 'bg-slate-700/80 border-slate-500/40 text-slate-300',
            )}
          >
            {meta.crown}
            {meta.rankLabel}
          </span>
        </div>

        {/* Pulsing aura for rank 1 - now wraps the whole unified card */}
        {center && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none z-0">
            <div className="absolute inset-0 rounded-2xl animate-pulse opacity-20 bg-brand-yellow/20 blur-md" />
          </div>
        )}

        {/* User Details (Top Section) */}
        <div className="relative flex flex-col items-center gap-1.5 w-full z-10">
          {/* Avatar */}
          <div className="relative mt-1">
            {/* Outer glow ring for rank 1 */}
            {center && (
              <div className="absolute inset-0 rounded-full bg-brand-yellow/30 blur-md scale-110 pointer-events-none" />
            )}
            <LeaderboardAvatar entry={entry} sizeClass={meta.avatarSize} ringClass={meta.ringClass} />
            {/* "You" badge */}
            {entry.isYou && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-brand-red border border-red-300/30 text-white text-[7px] font-black px-1.5 py-px leading-tight uppercase tracking-wider shadow-md">
                Kamu
              </div>
            )}
          </div>

          {/* Name */}
          <p
            className={cn(
              'max-w-full truncate text-center font-black tracking-tight leading-tight',
              center ? 'text-xs sm:text-sm text-white' : 'text-[10px] sm:text-xs text-slate-200',
            )}
          >
            {entry.name}
          </p>

          {/* Equipped title */}
          {entry.badgeTitle && (
            <BadgeTitlePill title={entry.badgeTitle} size={center ? 'default' : 'sm'} />
          )}

          {/* Points */}
          <p
            className={cn(
              'flex items-center gap-0.5 font-bold tabular-nums',
              center ? 'text-[11px] text-brand-yellow' : 'text-[10px] text-amber-400/80',
            )}
          >
            <Zap className={cn('shrink-0', center ? 'size-3' : 'size-2.5')} />
            {formatDisplayNumber(entry.points)} poin
          </p>
        </div>

        {/* Seamless Rank Number (Bottom Section) */}
        <div
          className={cn(
            'w-full flex items-center justify-center mt-3 z-10',
            meta.podiumHeight, // dynamic height provides vertical separation seamlessly
          )}
        >
          <span className={cn('font-black tabular-nums tracking-tight leading-none', meta.rankClass)}>
            {entry.rank}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── LeaderboardRow (Rank 4–10) ─────────────────────────────────────────────────

function LeaderboardRow({ entry, index }: { entry: StudentLeaderboardEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.045, ease: 'easeOut' }}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5',
        'border transition-all duration-150 cursor-default',
        'hover:-translate-y-0.5 hover:shadow-md',
        entry.isYou
          ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/15 hover:border-primary/40 hover:shadow-primary/10'
          : 'border-border/60 bg-card/50 backdrop-blur-sm hover:border-border hover:shadow-black/5',
      )}
    >
      {/* Rank badge */}
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black tabular-nums transition-colors',
          entry.isYou
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground group-hover:bg-muted/80',
        )}
      >
        {entry.rank}
      </span>

      {/* Avatar */}
      <div className="relative shrink-0">
        {entry.imageUrl ? (
          <Image
            src={entry.imageUrl}
            alt=""
            width={32}
            height={32}
            className={cn(
              'size-8 rounded-full border-2 object-cover ring-1',
              entry.isYou ? 'border-primary ring-primary/30' : 'border-border ring-border/50',
            )}
          />
        ) : (
          <div
            className={cn(
              'size-8 flex items-center justify-center rounded-full border-2 ring-1 text-[10px] font-bold',
              entry.isYou
                ? 'border-primary ring-primary/30 bg-primary/10 text-primary'
                : 'border-border ring-border/40 bg-muted text-muted-foreground',
            )}
          >
            {entry.avatar}
          </div>
        )}
      </div>

      {/* Name + Title/Level */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <p
            className={cn(
              'truncate text-sm font-semibold leading-tight',
              entry.isYou ? 'text-primary' : 'text-foreground',
            )}
          >
            {entry.name}
          </p>
          {entry.isYou && (
            <span className="shrink-0 text-[9px] font-black uppercase text-primary/70 tracking-wider leading-tight">
              · Kamu
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {entry.badgeTitle ? (
            <BadgeTitlePill title={entry.badgeTitle} size="sm" />
          ) : (
            <span className="text-[10px] text-muted-foreground font-medium">
              {entry.levelLabel}
            </span>
          )}
        </div>
      </div>

      {/* Points */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums',
          entry.isYou ? 'text-primary' : 'text-foreground',
        )}
      >
        <Zap className="size-3.5 text-brand-yellow shrink-0" />
        {formatDisplayNumber(entry.points)}
      </div>
    </motion.div>
  );
}

// ─── UserContextBanner ───────────────────────────────────────────────────────────

function UserContextBanner({
  pointsToNext,
  nextRankName,
}: {
  pointsToNext: number;
  nextRankName: string | undefined;
}) {
  if (pointsToNext <= 0 || !nextRankName) return null;
  return (
    <div className="relative border-t border-white/10 px-5 py-3 sm:px-6 flex items-center gap-2 text-xs sm:text-sm text-white/80 bg-black/15 z-10">
      <ChevronUp className="size-4 text-brand-yellow animate-bounce shrink-0" />
      <span>
        Tinggal{' '}
        <strong className="text-brand-yellow">{formatDisplayNumber(pointsToNext)} poin</strong>{' '}
        lagi untuk menyalip <strong className="text-white">{nextRankName}</strong>! Semangat!
      </span>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

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
    <div className="space-y-5 pb-8">

      {/* ── Hero Banner ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-2xl shadow-2xl text-white"
        style={{ background: 'linear-gradient(135deg, #1E1B57 0%, #14123c 55%, #2a1040 100%)' }}
      >
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={LANDING_HERO_GRID_STYLE}
        />

        {/* Radial glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-yellow/12 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-10 left-4 h-48 w-48 rounded-full bg-brand-red/15 blur-[70px]" />
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-32 w-80 rounded-full bg-brand-orange/8 blur-[60px]" />

        {/* Main content */}
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 z-10">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black tracking-widest text-brand-yellow uppercase">
              <Swords className="size-3" />
              Arena Kompetisi
            </p>
            <h1 className="flex items-center gap-2.5 text-2xl font-black text-white sm:text-3xl tracking-tight">
              <Trophy className="size-7 text-brand-yellow drop-shadow-[0_2px_10px_rgba(248,231,28,0.5)] animate-pulse" />
              Papan Peringkat
            </h1>
            <p className="mt-1.5 max-w-sm text-xs text-white/65 sm:text-sm leading-relaxed">
              10 Pelajar terbaik dengan poin tertinggi. Selesaikan pelajaran &amp; try out untuk
              naik peringkat!
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:min-w-[17rem]">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-sm">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                Peringkat Anda
              </p>
              <p className="text-2xl font-black text-brand-yellow leading-none">
                {context.rank != null ? `#${context.rank}` : '—'}
              </p>
              {context.rank != null && context.percentile !== '—' && (
                <p className="mt-0.5 text-[9px] text-white/50 font-semibold">
                  {context.percentile}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-sm">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <Users className="size-2.5" />
                Total Pelajar
              </p>
              <p className="text-2xl font-black text-white leading-none">
                {context.totalLearnersLabel}
              </p>
            </div>
          </div>
        </div>

        <UserContextBanner
          pointsToNext={context.pointsToNext}
          nextRankName={context.nextRankName}
        />
      </section>

      {/* ── Rankings Card ────────────────────────────────────────────────────────── */}
      {top10.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

          {/* Card header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5 bg-muted/20">
            <h2 className="flex items-center gap-2 font-black text-foreground tracking-tight">
              <Trophy className="size-4 text-brand-yellow" />
              {podiumTitle}
            </h2>
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black text-primary-foreground uppercase tracking-wider">
              Top {Math.min(10, top10.length)}
            </span>
          </div>

          {/* ── Podium zone ─────────────────────────────────────────────────────── */}
          <div
            className="relative border-b border-border py-8 px-4 sm:px-8 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #181548 0%, #12103a 100%)' }}
          >
            {/* Decorative lights */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-32 w-64 bg-brand-yellow/6 blur-[60px] rounded-full" />
            <div className="pointer-events-none absolute -bottom-8 left-0 h-24 w-48 bg-brand-red/8 blur-[50px] rounded-full" />
            <div className="pointer-events-none absolute -bottom-8 right-0 h-24 w-48 bg-brand-orange/8 blur-[50px] rounded-full" />

            <div
              className={cn(
                'relative mx-auto flex items-end justify-center gap-3 sm:gap-4',
                top10.length === 1
                  ? 'max-w-[14rem]'
                  : top10.length === 2
                    ? 'max-w-sm'
                    : 'max-w-xl',
              )}
            >
              {podiumSlots.map((slot, index) => (
                <PodiumSlot
                  key={slot.entry.userId}
                  entry={slot.entry}
                  meta={PODIUM_META[slot.metaIndex]}
                  center={slot.center}
                  delay={0.08 + index * 0.1}
                />
              ))}
            </div>
          </div>

          {/* ── Guild ranking board (Rank 4–10) ─────────────────────────────────── */}
          {rest.length > 0 && (
            <div className="p-4 sm:p-5">
              <p className="mb-3 flex items-center gap-1.5 px-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                <Shield className="size-3" />
                Guild Ranking · Rank 4–10
              </p>
              <div className="space-y-1.5">
                {rest.map((entry, index) => (
                  <LeaderboardRow key={entry.userId} entry={entry} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="border-t border-border px-4 py-4 sm:px-5">
            <Button asChild variant="outline" className="w-full gap-2 font-bold">
              <Link href={STUDENT_ROUTES.achievements}>
                <Award className="size-4" />
                Lihat koleksi badge
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <Trophy className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">
            Leaderboard masih kosong
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Selesaikan lesson atau quiz untuk mengumpulkan poin &amp; tampil di sini!
          </p>
        </section>
      )}

      {/* XP footnote */}
      {core.totalXp > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Total XP kamu (level):{' '}
          <span className="font-bold text-foreground">{formatDisplayNumber(core.totalXp)}</span>{' '}
          · Poin LMS:{' '}
          <span className="font-bold text-foreground">{formatDisplayNumber(core.lmsPoints)}</span>
        </p>
      )}
    </div>
  );
}
