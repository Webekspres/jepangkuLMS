'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Calendar,
  ChevronRight,
  Flame,
  Play,
  Star,
  TrendingUp,
  Trophy,
  Wifi,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  formatDisplayNumber,
  LANDING_HERO_GRID_STYLE,
} from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';
import { DashboardJlptPath } from './dashboard-jlpt-path';
import {
  DASHBOARD_CONTINUE_LESSONS,
  DASHBOARD_LEADERBOARD_PREVIEW,
  DASHBOARD_LIVE_SCHEDULE,
  DASHBOARD_MOCK_USER,
  DASHBOARD_STATS,
  DASHBOARD_WEEKLY_XP,
  DASHBOARD_WEEKLY_XP_MAX,
  LESSON_CATEGORY_STYLE,
} from './dashboard-data';
import { STUDENT_ROUTES } from './student-routes';

function DashboardSection({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: typeof Play;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
          <Icon className="size-5 text-primary" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DashboardPage() {
  const xpProgress = Math.round(
    (DASHBOARD_MOCK_USER.totalXp / DASHBOARD_MOCK_USER.xpToNextLevel) * 100,
  );

  return (
    <div className="space-y-6 pb-10 sm:space-y-8">
      {/* Welcome — grid texture only */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm"
      >
        <div className="pointer-events-none absolute inset-0 opacity-50" style={LANDING_HERO_GRID_STYLE} />

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              おはよう
            </p>
            <h1 className="text-[clamp(1.35rem,3vw,1.75rem)] font-extrabold tracking-tight text-foreground">
              Halo, {DASHBOARD_MOCK_USER.displayName}!{' '}
              <span className="inline-block" aria-hidden>
                👋
              </span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fokus {DASHBOARD_MOCK_USER.jlptFocus} · Terus semangat belajar hari ini
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
                <Flame className="size-3.5" />
                {DASHBOARD_MOCK_USER.streakDays} hari streak
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/25 bg-brand-yellow/10 px-3 py-1 text-xs font-semibold text-amber-700">
                <Zap className="size-3.5 text-primary" />
                {formatDisplayNumber(DASHBOARD_MOCK_USER.totalXp)} XP
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground">
                <Star className="size-3.5 text-primary" />
                Rank #{DASHBOARD_MOCK_USER.globalRank}
              </span>
            </div>
          </div>

          <Button asChild size="lg" className="h-11 shrink-0 gap-2 px-6">
            <Link href={DASHBOARD_CONTINUE_LESSONS[0].href}>
              <Play className="size-4" />
              Lanjutkan Belajar
            </Link>
          </Button>
        </div>
      </motion.section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {DASHBOARD_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className={cn('flex size-9 items-center justify-center rounded-xl', stat.accentClass)}>
                <stat.icon className="size-5" />
              </div>
              <TrendingUp className="size-4 text-muted-foreground/30" />
            </div>
            <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xs font-medium text-primary">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* JLPT path */}
      <DashboardJlptPath />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <DashboardSection
            title="Lanjutkan Belajar"
            icon={Play}
            action={
              <Link href={STUDENT_ROUTES.kursus} className="text-xs font-semibold text-primary hover:underline">
                Semua
              </Link>
            }
          >
            <div className="space-y-3">
              {DASHBOARD_CONTINUE_LESSONS.map((lesson) => {
                const cat = LESSON_CATEGORY_STYLE[lesson.category];
                return (
                  <Link
                    key={lesson.href}
                    href={lesson.href}
                    className="group flex gap-3 rounded-xl border border-border/80 bg-background/80 p-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-20">
                      <Image
                        src={lesson.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cat.badge)}>
                          {lesson.category}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">{lesson.level}</span>
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                        {lesson.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{lesson.duration}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn('h-full rounded-full', cat.bar)}
                            style={{ width: `${lesson.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                          {lesson.progress > 0 ? `${lesson.progress}%` : 'Belum dimulai'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 self-center text-muted-foreground group-hover:text-primary" />
                  </Link>
                );
              })}
            </div>
          </DashboardSection>

          <DashboardSection title="XP Mingguan" icon={TrendingUp}>
            <div className="flex h-36 items-end justify-between gap-1 sm:gap-2">
              {DASHBOARD_WEEKLY_XP.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.xp / DASHBOARD_WEEKLY_XP_MAX) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="w-full min-h-[8px] max-h-24 rounded-t-md bg-linear-to-t from-brand-red via-brand-orange to-brand-yellow"
                  />
                  <span className="text-[10px] font-medium text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Total minggu ini:{' '}
              <span className="font-semibold text-foreground">
                {formatDisplayNumber(DASHBOARD_WEEKLY_XP.reduce((s, d) => s + d.xp, 0))} XP
              </span>
            </p>
          </DashboardSection>

          <DashboardSection
            title="Leaderboard"
            icon={Trophy}
            action={
              <Link href={STUDENT_ROUTES.leaderboard} className="text-xs font-semibold text-primary hover:underline">
                Lihat semua →
              </Link>
            }
          >
            <ul className="space-y-2">
              {DASHBOARD_LEADERBOARD_PREVIEW.map((row) => (
                <li
                  key={row.rank}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm',
                    row.isYou ? 'border border-primary/20 bg-primary/5 font-semibold' : 'bg-muted/30',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full text-xs font-bold',
                        row.rank <= 3 ? 'bg-brand-yellow/20 text-amber-700' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {row.rank}
                    </span>
                    {row.name}
                    {row.isYou && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                        Kamu
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatDisplayNumber(row.xp)} XP
                  </span>
                </li>
              ))}
            </ul>
          </DashboardSection>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          <DashboardSection title="Gamifikasi" icon={Zap}>
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-20 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
                <span className="text-2xl font-black text-primary">Lv.{DASHBOARD_MOCK_USER.level}</span>
              </div>
              <p className="font-bold text-foreground">{DASHBOARD_MOCK_USER.levelTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDisplayNumber(DASHBOARD_MOCK_USER.totalXp)} /{' '}
                {formatDisplayNumber(DASHBOARD_MOCK_USER.xpToNextLevel)} XP ke Level{' '}
                {DASHBOARD_MOCK_USER.level + 1}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link href={STUDENT_ROUTES.profil}>Lihat Profil XP</Link>
              </Button>
            </div>
          </DashboardSection>

          <DashboardSection title="Jadwal Live Class" icon={Calendar}>
            <ul className="space-y-3">
              {DASHBOARD_LIVE_SCHEDULE.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-border/80 bg-background/80 p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    {item.live && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        <Wifi className="size-3" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                  <p className="text-xs text-muted-foreground">{item.sensei}</p>
                </li>
              ))}
            </ul>
          </DashboardSection>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Data demo — akan terhubung ke Core JWT & progress Prisma setelah auth siap.
      </p>
    </div>
  );
}
