'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  Lock,
  MapPin,
  Star,
  Target,
  BookOpen,
  Trophy,
  Compass,
} from 'lucide-react';
import {
  JLPT_ACCENT,
  JLPT_LEVELS,
  LANDING_HERO_GRID_STYLE,
} from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';
import { type JlptPathItem } from './dashboard-data';
import { STUDENT_ROUTES } from './student-routes';

const LEVEL_META = Object.fromEntries(JLPT_LEVELS.map((entry) => [entry.level, entry]));

const JLPT_LEVEL_ACCENT = Object.fromEntries(
  JLPT_LEVELS.map((entry) => [entry.level, JLPT_ACCENT[entry.accent]]),
);

const segments = [
  { path: "M 10 67.7 C 20 67.7, 20 24.6, 30 24.6" },
  { path: "M 30 24.6 C 40 24.6, 40 67.7, 50 67.7" },
  { path: "M 50 67.7 C 60 67.7, 60 24.6, 70 24.6" },
  { path: "M 70 24.6 C 80 24.6, 80 67.7, 90 67.7" },
];

function StageNode({ item }: { item: JlptPathItem }) {
  const meta = LEVEL_META[item.level];
  const done = item.status === 'done';
  const active = item.status === 'active';
  const locked = item.status === 'locked';

  const progress = done ? 100 : active ? (item.progress ?? 0) : 0;
  const circumference = 238.76; // 2 * PI * 38

  return (
    <div className="relative flex flex-col items-center">
      {/* Tooltip / Active Indicator */}
      {active && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <motion.div
            initial={{ y: 5 }}
            animate={{ y: 0 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.2, ease: "easeInOut" }}
            className="relative bg-brand-red text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-md shadow-lg tracking-wider flex items-center gap-1 whitespace-nowrap"
          >
            <MapPin className="size-3 fill-white animate-pulse" />
            Kamu di sini
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-brand-red" />
          </motion.div>
        </div>
      )}

      {/* Emblem Frame Container */}
      <div className="relative size-24 flex items-center justify-center">
        {/* Pulsing Outer Glow Aura for Active Node */}
        {active && (
          <div className="absolute inset-0 rounded-full animate-ping border-2 border-brand-red/40 opacity-75 pointer-events-none scale-105" />
        )}

        {/* Progress Ring (SVG) */}
        <svg className="absolute inset-0 size-full -rotate-90 z-10" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r="38"
            fill="transparent"
            className="stroke-muted/40 dark:stroke-muted/15"
            strokeWidth="2.5"
          />
          {progress > 0 && (
            <motion.circle
              cx="48"
              cy="48"
              r="38"
              fill="transparent"
              stroke={done ? "#eab308" : "url(#active-ring-gradient)"}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Central Emblem Crest */}
        <div
          className={cn(
            'relative size-[70px] rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 z-20',
            // Done: gold gradient fill
            done && 'border-amber-400 bg-linear-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30',
            // Active: solid crimson fill — high contrast badge look
            active && 'border-brand-red bg-brand-red shadow-xl shadow-brand-red/40 scale-105',
            // Locked: solid muted fill so nodes read clearly against any background
            locked && 'border-border bg-muted shadow-sm',
          )}
        >
          {/* Crest Details */}
          <div className="flex flex-col items-center justify-center select-none">
            <span className={cn(
              "text-[8px] font-black tracking-widest uppercase mb-0.5",
              done  && "text-white/80",
              active && "text-white/80",
              locked && "text-muted-foreground/60"
            )}>
              {meta.badge}
            </span>
            <span className={cn(
              "text-xl font-black tracking-tight leading-none",
              done   && "text-white",
              active && "text-white",
              locked && "text-muted-foreground/50"
            )}>
              {locked ? <Lock className="size-5 text-muted-foreground/50" strokeWidth={2.5} /> : item.level}
            </span>
          </div>

          {/* Achievement Star Pin for Done Levels */}
          {done && (
            <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-brand-yellow border-2 border-card flex items-center justify-center shadow-md z-30">
              <Star className="size-3 fill-white text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Label Text below the Node */}
      <div className="mt-3 w-40 text-center px-1">
        <p className={cn(
          'text-sm font-black tracking-tight',
          locked ? 'text-muted-foreground/50' : 'text-foreground'
        )}>
          {item.level} · {meta.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
          {meta.desc}
        </p>
        <p
          className={cn(
            'mt-1 text-[10px] font-extrabold uppercase tracking-wide',
            done && 'text-amber-600 dark:text-brand-yellow',
            active && 'text-brand-red dark:text-brand-orange',
            locked && 'text-muted-foreground/50',
          )}
        >
          {done ? 'Selesai' : active ? 'Sedang belajar' : 'Terkunci'}
        </p>
      </div>
    </div>
  );
}

function ActiveStagePanel({ item }: { item: JlptPathItem }) {
  const meta = LEVEL_META[item.level];
  const progress = item.progress ?? 0;

  return (
    <div className="mx-5 mt-8 mb-6 hidden md:block sm:mx-6">
      {/* RPG Character Dashboard Panel */}
      <div className="relative rounded-2xl bg-brand-navy dark:bg-slate-900 border border-brand-yellow/30 p-6 shadow-xl overflow-hidden text-white">
        {/* Visual decoration grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] bg-repeat"
          style={LANDING_HERO_GRID_STYLE}
        />
        {/* Subtle orange/red radial backdrop glow */}
        <div className="absolute -right-20 -bottom-20 size-60 rounded-full bg-brand-orange/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-12 gap-6 items-center">
          {/* Left: Level Crest & Status (Col span 3) */}
          <div className="col-span-3 flex flex-col items-center border-r border-white/10 pr-6">
            <div className="relative size-20 rounded-full bg-linear-to-br from-brand-red/30 to-brand-orange/30 border border-brand-yellow/40 flex items-center justify-center shadow-lg shadow-brand-orange/10 animate-pulse-subtle">
              <span className="text-3xl font-black text-brand-yellow tracking-tighter">{item.level}</span>
              <div className="absolute inset-0 rounded-full border border-white/10 scale-90" />
            </div>
            <div className="mt-3 text-center">
              <h4 className="text-xs font-black tracking-widest text-brand-yellow uppercase">{meta.label}</h4>
              <div className="mt-1.5 flex items-center gap-1.5 justify-center">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-brand-orange"></span>
                </span>
                <span className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider">Sedang Belajar</span>
              </div>
            </div>
          </div>

          {/* Center: Quest log & Progress (Col span 6) */}
          <div className="col-span-6 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-wider text-brand-yellow uppercase flex items-center gap-1">
                <Compass className="size-3" />
                Quest Utama Aktif
              </span>
              <h3 className="text-lg font-black tracking-tight text-white">
                Taklukkan Level {item.level} · {meta.label}
              </h3>
              <p className="text-xs text-white/70 leading-relaxed max-w-md">
                {meta.desc}. Pelajari semua modul untuk membuka ujian penentuan level berikutnya!
              </p>
            </div>

            {/* EXP / Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold tracking-tight">
                <span className="text-white/60">PROGRESS PETUALANGAN (EXP)</span>
                <span className="text-brand-yellow font-black">{progress}%</span>
              </div>
              <div className="h-3.5 overflow-hidden rounded-full bg-slate-950/50 p-[2px] border border-white/5 shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Right: Equipment slots / stats (Col span 3) */}
          <div className="col-span-3 flex flex-col gap-3 pl-4">
            {/* Stat slot 1: Modules */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 shadow-sm hover:bg-white/10 transition-colors">
              <div className="size-10 rounded-lg bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                <BookOpen className="size-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-white/50 tracking-wider uppercase">Dungeon Modul</p>
                <p className="text-base font-extrabold text-white">{meta.modules} Modul</p>
              </div>
            </div>

            {/* Stat slot 2: Bonus Estimate */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 shadow-sm hover:bg-white/10 transition-colors">
              <div className="size-10 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-brand-yellow">
                <Trophy className="size-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-white/50 tracking-wider uppercase">XP Terkumpul</p>
                <p className="text-base font-extrabold text-white">{progress * 10} XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileNode({ item }: { item: JlptPathItem }) {
  const meta = LEVEL_META[item.level];
  const done = item.status === 'done';
  const active = item.status === 'active';
  const locked = item.status === 'locked';
  const progress = done ? 100 : active ? (item.progress ?? 0) : 0;
  const circumference = 163.36; // 2 * PI * 26

  return (
    <div className="relative size-16 flex items-center justify-center shrink-0 z-20">
      {active && (
        <div className="absolute inset-0 rounded-full animate-ping border border-brand-red/40 opacity-75 pointer-events-none scale-105" />
      )}

      {/* Progress Ring */}
      <svg className="absolute inset-0 size-full -rotate-90 z-10" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="transparent"
          className="stroke-muted/40 dark:stroke-muted/15"
          strokeWidth="2"
        />
        {progress > 0 && (
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="transparent"
            stroke={done ? "#eab308" : "url(#active-ring-gradient)"}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Central emblem — solid fills for all states */}
      <div
        className={cn(
          'relative size-[48px] rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 z-20',
          done   && 'border-amber-400 bg-linear-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30',
          active && 'border-brand-red bg-brand-red shadow-xl shadow-brand-red/40 scale-105',
          locked && 'border-border bg-muted shadow-sm',
        )}
      >
        <div className="flex flex-col items-center justify-center select-none">
          <span className={cn(
            "text-[6px] font-black tracking-wider uppercase mb-0.5",
            (done || active) && "text-white/80",
            locked && "text-muted-foreground/60"
          )}>
            {meta.badge}
          </span>
          {locked
            ? <Lock className="size-3.5 text-muted-foreground/50" strokeWidth={2.5} />
            : <span className={cn(
                "text-xs font-black tracking-tight leading-none",
                (done || active) && "text-white",
              )}>{item.level}</span>
          }
        </div>

        {done && (
          <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-brand-yellow border border-card flex items-center justify-center shadow-md z-30">
            <Star className="size-2 fill-white text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Mobile-only: compact quest card pinned at the bottom of the snake map */
function MobileActiveCard({ item }: { item: JlptPathItem }) {
  const meta = LEVEL_META[item.level];
  const done = item.status === 'done';
  const active = item.status === 'active';
  const progress = done ? 100 : active ? (item.progress ?? 0) : 0;

  return (
    <div className="relative rounded-2xl bg-brand-navy border border-brand-yellow/25 p-4 text-white overflow-hidden shadow-xl">
      {/* Subtle glow behind the panel */}
      <div className="absolute -right-12 -bottom-12 size-40 rounded-full bg-brand-orange/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-4">
        {/* Level Badge */}
        <div className="shrink-0 size-14 rounded-full bg-brand-red border border-brand-yellow/40 flex flex-col items-center justify-center shadow-lg shadow-brand-red/30">
          <span className="text-[7px] font-black text-white/70 uppercase tracking-widest">{meta.badge}</span>
          <span className="text-base font-black text-white leading-none">{item.level}</span>
        </div>

        {/* Quest Info */}
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-[9px] font-black text-brand-yellow uppercase tracking-wider flex items-center gap-1">
              <Compass className="size-2.5" />
              {done ? 'Level Selesai' : 'Quest Aktif'}
            </p>
            <p className="text-sm font-black text-white tracking-tight">{item.level} · {meta.label}</p>
          </div>

          {/* EXP Bar */}
          {progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold">
                <span className="text-white/50 uppercase">EXP</span>
                <span className="text-brand-yellow font-black">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/30 border border-white/10 p-[1px]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Module count badge */}
        <div className="shrink-0 flex flex-col items-center border border-white/10 rounded-xl bg-white/5 px-3 py-2">
          <BookOpen className="size-4 text-brand-orange mb-1" />
          <span className="text-base font-black text-white tabular-nums">{meta.modules}</span>
          <span className="text-[8px] font-semibold text-white/50 uppercase">Modul</span>
        </div>
      </div>
    </div>
  );
}

function MobileTrack({ jlptPath }: { jlptPath: JlptPathItem[] }) {
  // Active item or the last unlocked item drives the bottom info card
  const featuredItem =
    jlptPath.find((i) => i.status === 'active') ??
    [...jlptPath].reverse().find((i) => i.status === 'done') ??
    jlptPath[0]!;

  return (
    <div className="relative z-10 px-4 pb-5 pt-6 md:hidden">
      {/* ── Centered snake map ── */}
      <div className="relative mx-auto w-fit pb-4">
        {/* Vertical SVG connector lines drawn behind the nodes */}
        <svg
          className="absolute inset-0 size-full z-0 pointer-events-none overflow-visible"
          aria-hidden
        >
          {jlptPath.map((item, index) => {
            if (index === jlptPath.length - 1) return null;
            const isEven = index % 2 === 0;
            const isUnlocked = jlptPath[index + 1]?.status !== 'locked';
            // Node size 64px, gap 16px → vertical pitch = 80px, horizontal offset ±48px
            const x1 = isEven ? 104 : 56; // right edge of even, left edge of odd
            const y1 = index * 80 + 32;   // center of current node
            const x2 = isEven ? 56  : 104;
            const y2 = (index + 1) * 80 + 32; // center of next node
            const midY = (y1 + y2) / 2;

            return (
              <path
                key={item.level}
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                fill="none"
                stroke={isUnlocked ? 'url(#active-path-gradient)' : 'currentColor'}
                className={isUnlocked ? 'path-flow-animated' : 'text-muted-foreground/30'}
                strokeWidth={isUnlocked ? '2.5' : '2'}
                strokeDasharray={isUnlocked ? undefined : '5,5'}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Nodes column — alternates left/right via margin */}
        <ul className="relative z-10 flex flex-col gap-4">
          {jlptPath.map((item, index) => {
            const isEven = index % 2 === 0;
            const active = item.status === 'active';

            return (
              <li
                key={item.level}
                className={cn(
                  'flex items-center gap-3',
                  isEven ? 'justify-start' : 'justify-end',
                )}
              >
                {/* Active tooltip label on the side opposite the node */}
                {active && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border border-brand-red/30 bg-brand-red/10 px-2.5 py-1 text-[9px] font-extrabold text-brand-red uppercase tracking-wider whitespace-nowrap',
                      isEven ? 'order-last' : 'order-first',
                    )}
                  >
                    <MapPin className="size-2.5 fill-brand-red" />
                    Kamu di sini
                  </span>
                )}

                {/* Level label on the side opposite the node for all others */}
                {!active && (
                  <span
                    className={cn(
                      'text-[10px] font-bold whitespace-nowrap',
                      item.status === 'done'  && 'text-amber-600 dark:text-brand-yellow',
                      item.status === 'locked' && 'text-muted-foreground/50',
                      isEven ? 'order-last' : 'order-first',
                    )}
                  >
                    {item.status === 'done' ? '✓ ' : ''}{LEVEL_META[item.level]?.label}
                  </span>
                )}

                <MobileNode item={item} />
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Bottom Active Quest Card ── */}
      <div className="mt-8">
        <MobileActiveCard item={featuredItem} />
      </div>
    </div>
  );
}

export function DashboardJlptPath({ jlptPath }: { jlptPath: JlptPathItem[] }) {
  const activeItem = jlptPath.find((item) => item.status === 'active') || jlptPath[0];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Shared defs, gradients & micro-animations */}
      <svg className="absolute size-0 pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="active-path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EC1D24" />
            <stop offset="50%" stopColor="#FF4B2B" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="active-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC1D24" />
            <stop offset="100%" stopColor="#FF4B2B" />
          </linearGradient>
          <filter id="glow-filter-shared" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <style>
            {`
              @keyframes dashflow {
                to {
                  stroke-dashoffset: -20;
                }
              }
              .path-flow-animated {
                stroke-dasharray: 8, 6;
                animation: dashflow 1.5s linear infinite;
              }
            `}
          </style>
        </defs>
      </svg>

      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6 bg-muted/10">
        <h2 className="flex items-center gap-2 text-base font-black text-foreground sm:text-lg tracking-tight">
          <Target className="size-5 text-brand-red animate-pulse" />
          Jalur JLPT Saya
        </h2>
        <Link
          href={STUDENT_ROUTES.kursus}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-red hover:text-brand-orange transition-colors"
        >
          Lihat kursus
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="relative bg-card md:overflow-hidden">
        {/* Fine grid design system overlay */}
        <div
          className="pointer-events-none absolute inset-0 hidden opacity-30 dark:opacity-10 md:block"
          style={LANDING_HERO_GRID_STYLE}
        />

        {/* Desktop View */}
        <div className="relative z-10 hidden w-full px-5 pt-8 pb-16 md:block sm:px-6">
          <div className="relative h-[260px] w-full">
            {/* Winding Adventure Path Connector Lines */}
            <svg className="absolute inset-0 size-full z-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {segments.map((seg, idx) => {
                const targetItem = jlptPath[idx + 1];
                const isUnlocked = targetItem && targetItem.status !== 'locked';

                if (isUnlocked) {
                  return (
                    <Fragment key={idx}>
                      <path
                        d={seg.path}
                        fill="none"
                        stroke="url(#active-path-gradient)"
                        strokeWidth="6"
                        opacity="0.25"
                        filter="url(#glow-filter-shared)"
                      />
                      <path
                        d={seg.path}
                        fill="none"
                        stroke="url(#active-path-gradient)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className="path-flow-animated"
                      />
                    </Fragment>
                  );
                } else {
                  return (
                    <path
                      key={idx}
                      d={seg.path}
                      fill="none"
                      stroke="currentColor"
                      className="text-muted-foreground/30 dark:text-muted-foreground/15"
                      strokeWidth="2"
                      strokeDasharray="6,6"
                      strokeLinecap="round"
                    />
                  );
                }
              })}
            </svg>

            {/* Nodes */}
            <div className="absolute inset-0 grid grid-cols-5 h-full z-10">
              {jlptPath.map((item, index) => {
                const isEven = index % 2 === 0;
                // Alternate vertical alignment
                const yOffset = isEven ? 'mt-32' : 'mt-4';

                return (
                  <div key={item.level} className={cn("flex flex-col items-center justify-start", yOffset)}>
                    <StageNode item={item} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <MobileTrack jlptPath={jlptPath} />
      </div>

      {/* RPG Bottom panel showing progress details */}
      {activeItem && <ActiveStagePanel item={activeItem} />}
    </section>
  );
}
