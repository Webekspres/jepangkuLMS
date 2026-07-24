'use client';

import { Cell, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import type { DashboardLiveFill } from '@/features/admin-cms/lib/load-admin-dashboard-insights';
import { CHART_PRIMARY, DASHBOARD_CHART_COLORS } from '@/features/admin-cms/components/dashboard/charts/chart-theme';

export function LiveFillChart({ data }: { data: DashboardLiveFill[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Belum ada live class terpublikasi.
      </p>
    );
  }

  const top = data.slice(0, 5);
  const avgFill = Math.round(top.reduce((s, r) => s + r.fillPercent, 0) / top.length);
  const radialData = [{ name: 'Fill', value: avgFill, fill: CHART_PRIMARY }];

  return (
    <div className="flex h-48 flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={radialData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background cornerRadius={8}>
              <Cell fill={CHART_PRIMARY} />
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-foreground">{avgFill}%</span>
          <span className="text-[10px] text-muted-foreground">rata-rata</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {top.map((row, index) => (
          <li key={row.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-foreground">{row.title}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.filledSlots}/{row.maxSlots}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${row.fillPercent}%`,
                  backgroundColor: DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
