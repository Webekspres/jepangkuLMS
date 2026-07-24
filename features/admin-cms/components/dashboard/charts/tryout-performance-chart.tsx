'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardTryoutLevelStat } from '@/features/admin-cms/lib/load-admin-dashboard-insights';
import {
  CHART_ACCENT,
  CHART_AXIS,
  CHART_MARGIN,
  CHART_MUTED_GRID,
  CHART_PRIMARY,
} from '@/features/admin-cms/components/dashboard/charts/chart-theme';
import { DashboardChartTooltip } from '@/features/admin-cms/components/dashboard/charts/chart-tooltip';

export function TryoutPerformanceChart({ data }: { data: DashboardTryoutLevelStat[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Belum ada attempt tryout di periode ini.
      </p>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={CHART_MUTED_GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="level"
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            width={32}
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<DashboardChartTooltip />} />
          <Bar dataKey="attempts" name="Attempt" fill={CHART_PRIMARY} radius={[6, 6, 0, 0]} />
          <Bar dataKey="avgScore" name="Rata-rata skor" fill={CHART_ACCENT} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
