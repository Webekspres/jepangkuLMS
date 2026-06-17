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
import { DashboardJlptPath } from './dashboard-jlpt-path';
import {
  buildDashboardStats,
  DASHBOARD_CONTINUE_LESSONS,
  DASHBOARD_LIVE_SCHEDULE,
  DASHBOARD_WEEKLY_XP,
  DASHBOARD_WEEKLY_XP_MAX,
  LESSON_CATEGORY_STYLE,
  type ContinueLesson,
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

export function DashboardPage({
  continueLessons = DASHBOARD_CONTINUE_LESSONS,
}: {
  continueLessons?: ContinueLesson[];
}) {
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();
  const displayName =
    identity?.displayName ?? core.displayName ?? '…';
  const stats = buildDashboardStats(core);
  const leaderboardPreview =
    core.leaderboardPreview.length > 0
      ? core.leaderboardPreview
      : core.leaderboardTop10.slice(0, 5).map(({ rank, name, points, isYou }) => ({
          rank,
          name,
          points,
          isYou,
        }));

  return (
    <div className="space-y-6 pb-10 sm:space-y-8">
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
              Halo, {displayName}!{' '}           
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {core.levelTitle
                ? `${core.levelTitle} · Lv.${core.level}`
                : `Level ${core.level}`}{' '}
              · Terus semangat belajar hari ini
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/25 bg-brand-yellow/10 px-3 py-1 text-xs font-semibold text-amber-700">
                <Zap className="size-3.5 text-primary" />
                {formatDisplayNumber(core.totalXp)} XP
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
                <Coins className="size-3.5" />
                {formatDisplayNumber(core.lmsPoints)} poin
              </span>
              {core.lmsRank != null ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground">
                  <Star className="size-3.5 text-primary" />
                  Rank #{core.lmsRank}
                </span>
              ) : null}
              {core.badgeCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Award className="size-3.5" />
                  {core.badgeCount} badge
                </span>
              ) : null}
            </div>
          </div>

          <Button asChild size="lg" className="h-11 shrink-0 gap-2 px-6">
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

      <DashboardJlptPath />

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
              })
              )}
            </div>
          </DashboardSection>

          {!core.coreConnected ? (
            <DashboardSection title="XP Mingguan" icon={TrendingUp}>
              <p className="text-sm text-muted-foreground">
                Grafik XP mingguan belum tersedia — menunggu koneksi ke Core Backend.
              </p>
            </DashboardSection>
          ) : (
            <DashboardSection title="XP Mingguan" icon={TrendingUp}>
              <div className="flex h-36 items-end justify-between gap-1 sm:gap-2">
                {DASHBOARD_WEEKLY_XP.map((day) => (
                  <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.xp / DASHBOARD_WEEKLY_XP_MAX) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="w-full min-h-[8px] max-h-24 rounded-t-md bg-linear-to-t from-brand-red via-brand-orange to-brand-yellow opacity-40"
                    />
                    <span className="text-[10px] font-medium text-muted-foreground">{day.day}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Breakdown harian belum tersedia di Core API — total XP di atas dari Core.
              </p>
            </DashboardSection>
          )}

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
                  : 'Menghubungkan ke Core untuk memuat leaderboard…'}
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
        {core.coreConnected
          ? 'XP, poin, rank, dan badge dari JepangKu Core.'
          : 'Menghubungkan ke Core… Refresh otomatis setelah JWT siap.'}
      </p>
    </div>
  );
}
