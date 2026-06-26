'use client';

import { TrendingUp } from 'lucide-react';
import { SimpleBarChart } from '@/components/charts/simple-bar-chart';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import type { DashboardWeeklyXpSummary } from '@/features/student/lib/load-dashboard-extras';
import { formatChartDateLong } from '@/lib/format-chart-date';
import { cn } from '@/lib/utils';

type WeeklyXpChartProps = {
  data: DashboardWeeklyXpSummary;
  className?: string;
};

export function WeeklyXpChart({ data, className }: WeeklyXpChartProps) {
  const { days, totalWeekXp } = data;
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

      <SimpleBarChart
        data={days.map((day) => ({
          key: day.dateKey,
          label: day.day,
          value: day.xp,
          tooltip: {
            title: formatChartDateLong(day.dateKey),
            value:
              day.xp === 0
                ? 'Belum ada XP tercatat'
                : `${formatDisplayNumber(day.xp)} XP`,
            description: `${day.day} · ${day.dateLabel}`,
          },
        }))}
        valueFormatter={formatDisplayNumber}
        barClassName="bg-linear-to-t from-brand-red via-brand-orange to-brand-yellow"
        emptyBarClassName="bg-muted/60"
        height={160}
      />

      <p className="text-xs text-muted-foreground">
        Grafik XP dari aktivitas belajar Anda dalam 7 hari terakhir.
      </p>
    </div>
  );
}
