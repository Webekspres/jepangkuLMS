'use client';

import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import type { DashboardWeeklyXpSummary } from '@/features/student/lib/load-dashboard-extras';
import { cn } from '@/lib/utils';

type WeeklyXpChartProps = {
  data: DashboardWeeklyXpSummary;
  className?: string;
};

export function WeeklyXpChart({ data, className }: WeeklyXpChartProps) {
  const { days, totalWeekXp } = data;
  const weeklyXpMax = Math.max(1, ...days.map((day) => day.xp));
  const hasActivity = totalWeekXp > 0;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {hasActivity
            ? `Total minggu ini: ${formatDisplayNumber(totalWeekXp)} XP`
            : 'Belum ada XP tercatat minggu ini — selesaikan pelajaran atau kuis.'}
        </p>
        {hasActivity ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <TrendingUp className="size-3" aria-hidden />
            Aktif
          </span>
        ) : null}
      </div>

      <div className="flex h-40 items-end justify-between gap-1 sm:gap-2">
        {days.map((day) => {
          const heightPct = day.xp > 0 ? Math.max(12, (day.xp / weeklyXpMax) * 100) : 4;
          return (
            <div key={day.dateKey} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                {day.xp > 0 ? formatDisplayNumber(day.xp) : ''}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={cn(
                  'w-full min-h-[4px] max-h-28 rounded-t-lg',
                  day.xp > 0
                    ? 'bg-linear-to-t from-brand-red via-brand-orange to-brand-yellow'
                    : 'bg-muted/60',
                )}
                title={`${day.dateLabel}: ${day.xp} XP`}
                aria-label={`${day.dateLabel}, ${day.xp} XP`}
              />
              <span className="text-[10px] font-medium text-muted-foreground">{day.day}</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        XP dari aktivitas belajar 7 hari terakhir (sinkron dengan penghargaan Core saat terhubung).
      </p>
    </div>
  );
}
