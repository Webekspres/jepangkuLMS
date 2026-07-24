'use client';

import { formatDisplayNumber } from '@/features/marketing/components/landing-data';

type PayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: unknown;
};

type DashboardChartTooltipProps = {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string | number;
  valueSuffix?: string;
};

export function DashboardChartTooltip({
  active,
  payload,
  label,
  valueSuffix = '',
}: DashboardChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      {label != null && label !== '' ? (
        <p className="mb-1 font-medium text-foreground">{String(label)}</p>
      ) : null}
      <ul className="space-y-0.5">
        {payload.map((item, index) => {
          const raw = typeof item.value === 'number' ? item.value : Number(item.value ?? 0);
          return (
            <li key={`${item.dataKey ?? item.name}-${index}`} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color ?? 'var(--chart-1)' }}
              />
              <span className="text-muted-foreground">{item.name ?? 'Nilai'}</span>
              <span className="ml-auto font-semibold tabular-nums text-foreground">
                {formatDisplayNumber(Number.isFinite(raw) ? raw : 0)}
                {valueSuffix}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
