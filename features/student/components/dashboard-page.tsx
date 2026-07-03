'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Award,
  Calendar,
  ChevronRight,
  Coins,
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
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import { cn } from '@/lib/utils';
import { useStudentCoreData } from './student-core-data-context';
import { ProfileAvatar } from '@/features/student/components/profile-avatar';
import { DashboardJlptPath } from './dashboard-jlpt-path';
import {
  buildDashboardStats,
  DASHBOARD_LIVE_SCHEDULE,
  DASHBOARD_WEEKLY_XP,
  LESSON_CATEGORY_STYLE,
  type ContinueLesson,
  type DashboardLivePreviewItem,
  type JlptPathItem,
} from './dashboard-data';
import { STUDENT_ROUTES } from './student-routes';
import { WeeklyXpChart } from './weekly-xp-chart';
import type { DashboardWeeklyXpSummary } from '@/features/student/lib/load-dashboard-extras';

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

export function DashboardPage({
  continueLessons = [],
  jlptPath,
  weeklyXpSummary,
  liveSchedule = DASHBOARD_LIVE_SCHEDULE.map((item) => ({
    id: item.title,
    title: item.title,
    time: item.time,
    sensei: item.sensei,
    live: item.live,
    href: '/dashboard/live-class',
  })),
}: {
  continueLessons?: ContinueLesson[];
  jlptPath: JlptPathItem[];
  weeklyXpSummary?: DashboardWeeklyXpSummary;
  liveSchedule?: DashboardLivePreviewItem[];
}) {
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();
  const displayName =
    core.displayName ?? identity?.displayName ?? '…';
  const badgeTitle = core.equippedBadgeTitle;
  const stats = buildDashboardStats(core);
  const weeklyXpData: DashboardWeeklyXpSummary = weeklyXpSummary ?? {
    days: DASHBOARD_WEEKLY_XP.map((day, index) => ({
      dateKey: `fallback-${index}`,
      day: day.day,
      dateLabel: day.day,
      xp: day.xp,
    })),
    totalWeekXp: DASHBOARD_WEEKLY_XP.reduce((sum, day) => sum + day.xp, 0),
  };
  const leaderboardPreview =
    core.leaderboardPreview.length > 0
      ? core.leaderboardPreview
      : core.leaderboardTop10.slice(0, 5).map(({ rank, name, points, isYou }) => ({
          rank,
          name,
          points,
          isYou,
        }));
  const avatarUrl = core.avatarUrl ?? identity?.imageUrl;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 pb-10 sm:space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-hero-navy relative overflow-hidden rounded-2xl shadow-lg"
      >
        <div className="pointer-events-none absolute inset-0 opacity-30" style={LANDING_HERO_GRID_STYLE} />
        <div className="pointer-events-none absolute right-0 top-0 size-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <ProfileAvatar
              imageUrl={avatarUrl}
              initial={initial}
              size="lg"
              className="border-2 border-white/30 shadow-md ring-2 ring-white/10"
            />
            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-white/50 uppercase">
                おはよう
              </p>
              <h1 className="text-[clamp(1.35rem,3vw,1.75rem)] font-extrabold tracking-tight text-white">
                Halo, {displayName}!
              </h1>
              <p className="mt-1 text-sm text-white/60">
                {badgeTitle ? (
                  <>
                    <span className="font-semibold text-brand-yellow">{badgeTitle}</span>
                    <span className="text-white/40"> · </span>
                  </>
                ) : null}
                {core.levelTitle
                  ? `${core.levelTitle} · Lv.${core.level}`
                  : `Level ${core.level}`}{' '}
                · Terus semangat belajar hari ini
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/30 bg-brand-yellow/15 px-3 py-1 text-xs font-semibold text-brand-yellow">
                  <Zap className="size-3.5" />
                  {formatDisplayNumber(core.totalXp)} XP
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300">
                  <Coins className="size-3.5" />
                  {formatDisplayNumber(core.lmsPoints)} poin
                </span>
                {core.lmsRank != null ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                    <Star className="size-3.5 text-primary" />
                    Rank #{core.lmsRank}
                  </span>
                ) : null}
                {core.badgeCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <Award className="size-3.5" />
                    {core.badgeCount} badge
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <Button asChild variant="ghost" size="lg" className="h-11 shrink-0 gap-2 border border-white/20 bg-white/15 px-6 text-white hover:bg-white/25 hover:text-white">
            <Link href={continueLessons[0]?.href ?? STUDENT_ROUTES.kursus}>
              <Play className="size-4" />
              Lanjutkan Belajar
            </Link>
          </Button>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
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

      <DashboardJlptPath jlptPath={jlptPath} />

      <div className="grid gap-6 lg:grid-cols-3">
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
              {continueLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada kursus aktif.{' '}
                  <Link href={STUDENT_ROUTES.kursus} className="font-semibold text-primary hover:underline">
                    Daftar kursus N5
                  </Link>
                </p>
              ) : (
                continueLessons.map((lesson) => {
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
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="flex size-8 items-center justify-center rounded-full bg-white/90 shadow">
                          <Play className="size-3.5 translate-x-0.5 fill-current text-primary" />
                        </span>
                      </div>
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
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn('h-full rounded-full', cat.bar)}
                            style={{ width: `${Math.max(5, lesson.progress)}%` }}
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
              })
              )}
            </div>
          </DashboardSection>

          <DashboardSection title="XP Mingguan" icon={TrendingUp}>
            <WeeklyXpChart data={weeklyXpData} />
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
            {leaderboardPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {core.coreConnected
                  ? 'Leaderboard kosong.'
                  : 'Memuat leaderboard…'}
              </p>
            ) : (
              <ul className="space-y-2">
                {leaderboardPreview.map((row) => (
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
                      {formatDisplayNumber(row.points)} poin
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>
        </div>

        <div className="space-y-6">
          <DashboardSection title="Gamifikasi" icon={Zap}>
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-20 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
                <span className="text-2xl font-black text-primary">Lv.{core.level}</span>
              </div>
              <p className="font-bold text-foreground">
                {core.levelTitle ?? 'Pemula'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDisplayNumber(core.totalXp)} XP ·{' '}
                {formatDisplayNumber(core.lmsPoints)} poin
              </p>
              {core.recentBadges.length > 0 ? (
                <div className="mt-4 flex justify-center gap-2">
                  {core.recentBadges.map((badge) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={badge.unlockedAt + badge.title}
                      src={badge.imageUrl}
                      alt={badge.title}
                      className="size-10 rounded-lg object-cover"
                    />
                  ))}
                </div>
              ) : null}
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link href={STUDENT_ROUTES.achievements}>
                  Lihat Badge ({core.badgeCount})
                </Link>
              </Button>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Kelas Interaktif Live"
            icon={Calendar}
            action={
              <Link href="/dashboard/live-class" className="text-xs font-semibold text-primary hover:underline">
                Lihat semua →
              </Link>
            }
          >
            {/* Visual Classroom Banner */}
            <div className="relative mb-4 h-24 w-full overflow-hidden rounded-xl bg-linear-to-r from-violet-600 to-indigo-600">
              <Image
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                alt="Live Class"
                fill
                className="object-cover opacity-45 mix-blend-overlay"
                sizes="(max-width: 768px) 100vw, 300px"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-3 bg-linear-to-t from-black/60 to-transparent">
                <span className="text-[10px] font-bold tracking-wider text-white/90 uppercase">
                  Tatap Muka Virtual
                </span>
                <p className="text-xs font-extrabold text-white leading-tight">
                  Tanya Jawab & Praktik Langsung Bersama Sensei
                </p>
              </div>
            </div>

            <ul className="space-y-3">
              {liveSchedule.length === 0 ? (
                <li className="text-xs text-muted-foreground leading-relaxed">
                  Belum ada kelas interaktif terjadwal. Ikuti sesi live untuk melatih percakapan langsung!
                </li>
              ) : (
              liveSchedule.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border/80 bg-background/80 p-3 hover:border-primary/20 transition-colors"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    {item.live ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary animate-pulse">
                        <Wifi className="size-3" />
                        LIVE SEKARANG
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">SELANJUTNYA</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{item.time}</span>
                    <span className="font-semibold text-primary">{item.sensei}</span>
                  </div>
                </li>
              ))
              )}
            </ul>
          </DashboardSection>
        </div>
      </div>
    </div>
  );
}
