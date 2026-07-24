'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardTrendPoint } from '@/features/admin-cms/lib/load-admin-dashboard-insights';
import { formatChartDateLong } from '@/lib/format-chart-date';
import {
  CHART_ACCENT,
  CHART_AXIS,
  CHART_MARGIN,
  CHART_MUTED_GRID,
} from '@/features/admin-cms/components/dashboard/charts/chart-theme';
import { DashboardChartTooltip } from '@/features/admin-cms/components/dashboard/charts/chart-tooltip';

export function StudentGrowthChart({ data }: { data: DashboardTrendPoint[] }) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Belum ada siswa baru di periode ini.
      </p>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={CHART_MUTED_GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            width={28}
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<DashboardChartTooltip />}
            labelFormatter={(_label, payload) => {
              const key = (payload?.[0]?.payload as { dateKey?: string } | undefined)?.dateKey;
              return key ? formatChartDateLong(key) : '';
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Siswa baru"
            stroke={CHART_ACCENT}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART_ACCENT }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
