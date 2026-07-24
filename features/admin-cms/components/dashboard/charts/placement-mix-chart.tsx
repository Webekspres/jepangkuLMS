'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardPlacementMix } from '@/features/admin-cms/lib/load-admin-dashboard-insights';
import { DASHBOARD_CHART_COLORS } from '@/features/admin-cms/components/dashboard/charts/chart-theme';
import { DashboardChartTooltip } from '@/features/admin-cms/components/dashboard/charts/chart-tooltip';

export function PlacementMixChart({ data }: { data: DashboardPlacementMix[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Belum ada hasil tes penempatan.
      </p>
    );
  }

  const chartData = data.map((d) => ({ name: d.level, value: d.count }));

  return (
    <div className="flex h-40 w-full items-center gap-3">
      <div className="h-36 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius="80%" paddingAngle={2}>
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<DashboardChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-20 shrink-0 space-y-1">
        {chartData.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{
                backgroundColor: DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length],
              }}
            />
            {entry.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
