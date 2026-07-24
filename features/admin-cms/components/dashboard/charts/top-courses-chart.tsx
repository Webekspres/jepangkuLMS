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
import type { DashboardTopCourse } from '@/features/admin-cms/lib/load-admin-dashboard-insights';
import {
  CHART_AXIS,
  CHART_MARGIN,
  CHART_MUTED_GRID,
  CHART_SECONDARY,
} from '@/features/admin-cms/components/dashboard/charts/chart-theme';
import { DashboardChartTooltip } from '@/features/admin-cms/components/dashboard/charts/chart-tooltip';

export function TopCoursesChart({ data }: { data: DashboardTopCourse[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Belum ada enrollment kursus.
      </p>
    );
  }

  const chartData = data.map((row) => ({
    ...row,
    shortTitle: row.title.length > 22 ? `${row.title.slice(0, 20)}…` : row.title,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ ...CHART_MARGIN, left: 8 }}>
          <CartesianGrid stroke={CHART_MUTED_GRID} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortTitle"
            width={100}
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<DashboardChartTooltip />} />
          <Bar dataKey="total" name="Enrollment" fill={CHART_SECONDARY} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
