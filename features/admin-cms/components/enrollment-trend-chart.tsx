'use client';

import { SimpleBarChart } from '@/components/charts/simple-bar-chart';
import type { AdminDashboardStats } from '@/features/admin-cms/lib/load-admin-dashboard-stats';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { formatChartDateLong } from '@/lib/format-chart-date';

export function EnrollmentTrendChart({ data }: { data: AdminDashboardStats['enrollmentTrend'] }) {
  return (
    <SimpleBarChart
      data={data.map((day) => ({
        key: day.dateKey,
        label: day.label,
        value: day.count,
        tooltip: {
          title: formatChartDateLong(day.dateKey),
          value:
            day.count === 0
              ? 'Tidak ada pendaftaran baru'
              : `${formatDisplayNumber(day.count)} pendaftaran baru`,
          description: `Hari ${day.label}`,
        },
      }))}
      valueFormatter={formatDisplayNumber}
      barClassName="bg-primary/85"
      height={160}
    />
  );
}
