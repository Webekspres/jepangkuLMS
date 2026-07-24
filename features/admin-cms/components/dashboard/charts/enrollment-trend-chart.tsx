'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardTrendPoint } from '@/features/admin-cms/lib/load-admin-dashboard-insights';
import { formatChartDateLong } from '@/lib/format-chart-date';
import {
  CHART_AXIS,
  CHART_MARGIN,
  CHART_MUTED_GRID,
  CHART_PRIMARY,
} from '@/features/admin-cms/components/dashboard/charts/chart-theme';
import { DashboardChartTooltip } from '@/features/admin-cms/components/dashboard/charts/chart-tooltip';

export function EnrollmentTrendChart({ data }: { data: DashboardTrendPoint[] }) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Belum ada enrollment baru di periode ini.
      </p>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="enrollmentArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="count"
            name="Enrollment"
            stroke={CHART_PRIMARY}
            fill="url(#enrollmentArea)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
