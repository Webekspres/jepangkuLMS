'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardEnrollmentMix } from '@/features/admin-cms/lib/load-admin-dashboard-insights';
import { DASHBOARD_CHART_COLORS } from '@/features/admin-cms/components/dashboard/charts/chart-theme';
import { DashboardChartTooltip } from '@/features/admin-cms/components/dashboard/charts/chart-tooltip';

export function EnrollmentMixChart({ data }: { data: DashboardEnrollmentMix[] }) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Belum ada data enrollment.
      </p>
    );
  }

  const chartData = filtered.map((d) => ({ name: d.label, value: d.count, type: d.type }));

  return (
    <div className="flex h-48 w-full flex-col items-center gap-2 sm:flex-row">
      <div className="h-40 w-full sm:flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.type}
                  fill={DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<DashboardChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-1.5 px-1 sm:w-36 sm:shrink-0">
        {chartData.map((entry, index) => (
          <li key={entry.type} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length],
              }}
            />
            <span className="truncate">{entry.name}</span>
            <span className="ml-auto tabular-nums font-medium text-foreground">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
