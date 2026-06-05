'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Lock, MapPin, Star, Target } from 'lucide-react';
import {
  JLPT_ACCENT,
  JLPT_LEVELS,
  LANDING_HERO_GRID_STYLE,
} from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';
import { DASHBOARD_JLPT_PATH, type JlptPathItem } from './dashboard-data';
import { STUDENT_ROUTES } from './student-routes';

const LEVEL_META = Object.fromEntries(JLPT_LEVELS.map((entry) => [entry.level, entry]));

const JLPT_LEVEL_ACCENT = Object.fromEntries(
  JLPT_LEVELS.map((entry) => [entry.level, JLPT_ACCENT[entry.accent]]),
);

function segmentFill(prev: JlptPathItem): number {
  if (prev.status === 'done') return 100;
  if (prev.status === 'active') return prev.progress ?? 0;
  return 0;
}

function segmentTone(prev: JlptPathItem) {
  if (prev.status === 'done') return 'bg-emerald-500';
  if (prev.status === 'active') return 'bg-primary';
  return 'bg-transparent';
}

/** Garis antar node — fleksibel, mengisi lebar sisa */
function PathSegment({ prev }: { prev: JlptPathItem }) {
  const fill = segmentFill(prev);
  const tone = segmentTone(prev);
  const traveled = fill > 0;

  return (
    <div className="hidden min-w-10 flex-[1.4] self-start pt-8 md:block" aria-hidden>
      <div className="flex w-full items-center gap-1 px-0.5">
        <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/80">
          {traveled && (
            <motion.div
              className={cn('h-full rounded-full', tone)}
              initial={{ width: 0 }}
              animate={{ width: `${fill}%` }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
            />
          )}
        </div>
        <ChevronRight
          className={cn(
            'size-5 shrink-0',
            prev.status === 'done' && 'text-emerald-600',
            prev.status === 'active' && 'text-primary',
            prev.status === 'locked' && 'text-muted-foreground/35',
          )}
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}

function StageNode({ item }: { item: JlptPathItem }) {
  const meta = LEVEL_META[item.level];
  const accent = JLPT_LEVEL_ACCENT[item.level];
  const done = item.status === 'done';
  const active = item.status === 'active';
  const locked = item.status === 'locked';

  return (
    <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center px-1">
      {active && (
        <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary whitespace-nowrap">
          <MapPin className="size-3" />
          Kamu di sini
        </span>
      )}

      <div
        className={cn(
          'flex size-16 items-center justify-center rounded-2xl border-2 bg-card shadow-sm sm:size-[4.5rem]',
          done && 'border-emerald-500/50 bg-emerald-500/10',
          active && 'border-primary bg-background shadow-md shadow-primary/10',
          locked && 'border-border bg-muted/50',
        )}
      >
        {done && <Star className="size-7 fill-brand-yellow text-brand-yellow" strokeWidth={0} />}
        {active && (
          <span className={cn('text-lg font-black tracking-tight', accent.text)}>{item.level}</span>
        )}
        {locked && <Lock className="size-5 text-muted-foreground" strokeWidth={2} />}
      </div>

      <div className="mt-3 w-full text-center">
        <p className={cn('text-sm font-bold sm:text-base', locked ? 'text-muted-foreground' : accent.text)}>
          {item.level}
        </p>
        <p className="text-xs font-medium text-foreground">{meta.label}</p>
        <p
          className={cn(
            'mt-0.5 text-[11px] font-semibold',
            done && 'text-emerald-700',
            active && 'text-primary',
            locked && 'text-muted-foreground',
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
  const accent = JLPT_LEVEL_ACCENT[item.level];

  if (item.progress == null) return null;

  return (
    <div className="mx-5 mb-5 hidden rounded-xl border border-border bg-muted/30 p-4 md:block sm:mx-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Level aktif</p>
          <p className="text-sm font-bold text-foreground">
            {item.level} · {meta.label}
          </p>
        </div>
        <span className={cn('rounded-lg border border-border bg-card px-2 py-1 text-sm font-black', accent.text)}>
          {item.level}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{meta.desc}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{item.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow"
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        <div className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-center">
          <p className="text-[10px] font-medium text-muted-foreground">Modul</p>
          <p className="text-lg font-bold tabular-nums text-foreground">{meta.modules}</p>
        </div>
      </div>
    </div>
  );
}

function MobileNode({ item }: { item: JlptPathItem }) {
  const accent = JLPT_LEVEL_ACCENT[item.level];
  const done = item.status === 'done';
  const active = item.status === 'active';
  const locked = item.status === 'locked';

  return (
    <div
      className={cn(
        'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border-2 bg-card shadow-sm',
        done && 'border-emerald-500',
        active && 'border-primary shadow-md shadow-primary/10',
        locked && 'border-border bg-muted',
      )}
    >
      {done && <Star className="size-5 fill-brand-yellow text-brand-yellow" strokeWidth={0} />}
      {active && <span className={cn('text-sm font-black', accent.text)}>{item.level}</span>}
      {locked && <Lock className="size-4 text-muted-foreground" strokeWidth={2} />}
    </div>
  );
}

/** Connector vertikal — hanya antar node, di kolom spine yang sama */
function MobileConnector({ prev }: { prev: JlptPathItem }) {
  const fill = segmentFill(prev);
  const tone = segmentTone(prev);

  return (
    <div className="flex h-5 w-10 shrink-0 items-center justify-center" aria-hidden>
      <div className="relative h-full w-1 overflow-hidden rounded-full bg-muted">
        {fill > 0 && (
          <motion.div
            className={cn('absolute inset-x-0 top-0 rounded-full', tone)}
            initial={{ height: 0 }}
            animate={{ height: `${fill}%` }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          />
        )}
      </div>
    </div>
  );
}

function MobileStageCard({ item }: { item: JlptPathItem }) {
  const meta = LEVEL_META[item.level];
  const accent = JLPT_LEVEL_ACCENT[item.level];
  const done = item.status === 'done';
  const active = item.status === 'active';
  const locked = item.status === 'locked';

  return (
    <div
      className={cn(
        'min-w-0 flex-1 rounded-xl border bg-card p-3.5 shadow-sm',
        done && 'border-emerald-500/40',
        active && 'border-primary/40',
        locked && 'border-border',
      )}
    >
      {active && (
        <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          <MapPin className="size-3" />
          Kamu di sini
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={cn(
              'text-sm font-bold text-foreground',
              done && 'text-emerald-800',
              active && accent.text,
            )}
          >
            {item.level} · {meta.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta.desc}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase',
            done && 'border-emerald-600/30 bg-emerald-500/15 text-emerald-800',
            active && 'border-primary/30 bg-primary/10 text-primary',
            locked && 'border-border bg-background text-muted-foreground',
          )}
        >
          {done ? 'Clear' : active ? 'Active' : 'Lock'}
        </span>
      </div>
      {active && item.progress != null && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] font-medium">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{item.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow"
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-foreground">{meta.modules} modul</p>
        </div>
      )}
      {done && (
        <p className="mt-2 text-[11px] font-semibold text-emerald-700">{meta.modules} modul selesai</p>
      )}
      {locked && (
        <p className="mt-2 text-[11px] text-muted-foreground">Selesaikan level sebelumnya</p>
      )}
    </div>
  );
}

function MobileTrack() {
  return (
    <div className="relative z-10 px-4 py-5 md:hidden">
      <ul className="flex flex-col">
        {DASHBOARD_JLPT_PATH.map((item, index) => {
          const isLast = index === DASHBOARD_JLPT_PATH.length - 1;

          return (
            <li key={item.level}>
              <div className="flex items-center gap-3">
                <div className="flex w-10 shrink-0 justify-center">
                  <MobileNode item={item} />
                </div>
                <MobileStageCard item={item} />
              </div>
              {!isLast && <MobileConnector prev={item} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DashboardJlptPath() {
  const activeItem = DASHBOARD_JLPT_PATH.find((item) => item.status === 'active');

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
          <Target className="size-5 text-primary" />
          Jalur JLPT Saya
        </h2>
        <Link
          href={STUDENT_ROUTES.kursus}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Lihat kursus
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="relative bg-card md:overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 hidden opacity-40 md:block"
          style={LANDING_HERO_GRID_STYLE}
        />
        <div className="pointer-events-none absolute inset-0 hidden bg-card/80 md:block" />

        {/* Desktop — full width, node & connector selang-seling */}
        <div className="relative z-10 hidden w-full items-start px-5 py-8 md:flex sm:px-6">
          {DASHBOARD_JLPT_PATH.map((item, index) => (
            <Fragment key={item.level}>
              {index > 0 && <PathSegment prev={DASHBOARD_JLPT_PATH[index - 1]!} />}
              <StageNode item={item} />
            </Fragment>
          ))}
        </div>

        <MobileTrack />
      </div>

      {activeItem && <ActiveStagePanel item={activeItem} />}
    </section>
  );
}
