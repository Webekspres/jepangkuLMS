'use client';

import { motion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type SimpleBarChartTooltip = {
  title: string;
  value: string;
  description?: string;
};

export type SimpleBarChartItem = {
  key: string;
  label: string;
  value: number;
  /** @deprecated Prefer `tooltip` — kept for aria / fallback */
  hint?: string;
  tooltip?: SimpleBarChartTooltip;
};

type SimpleBarChartProps = {
  data: SimpleBarChartItem[];
  height?: number;
  valueFormatter?: (value: number) => string;
  barClassName?: string;
  emptyBarClassName?: string;
  className?: string;
  animate?: boolean;
};

const DEFAULT_HEIGHT = 128;

function resolveTooltip(
  item: SimpleBarChartItem,
  formattedValue: string,
): SimpleBarChartTooltip {
  if (item.tooltip) return item.tooltip;

  return {
    title: item.label,
    value: formattedValue,
    description: item.hint,
  };
}

function ChartBar({
  barPx,
  item,
  barClassName,
  emptyBarClassName,
  animate,
}: {
  barPx: number;
  item: SimpleBarChartItem;
  barClassName: string;
  emptyBarClassName: string;
  animate: boolean;
}) {
  const className = cn(
    'w-full max-w-12 rounded-t-md transition-[filter,opacity] duration-200',
    'group-hover/chart-col:brightness-110 group-focus-visible/chart-col:brightness-110',
    item.value > 0 ? barClassName : emptyBarClassName,
  );

  if (animate) {
    return (
      <motion.div
        className={className}
        initial={{ height: 0 }}
        animate={{ height: barPx }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        aria-hidden
      />
    );
  }

  return <div className={className} style={{ height: barPx }} aria-hidden />;
}

function ChartTooltipBody({ tooltip }: { tooltip: SimpleBarChartTooltip }) {
  return (
    <div className="flex max-w-[220px] flex-col gap-0.5 text-left">
      <p className="font-semibold leading-snug">{tooltip.title}</p>
      <p className="tabular-nums leading-snug">{tooltip.value}</p>
      {tooltip.description ? (
        <p className="text-[11px] leading-snug text-background/75">{tooltip.description}</p>
      ) : null}
    </div>
  );
}

export function SimpleBarChart({
  data,
  height = DEFAULT_HEIGHT,
  valueFormatter = (value) => String(value),
  barClassName = 'bg-primary/85',
  emptyBarClassName = 'bg-muted/50',
  className,
  animate = true,
}: SimpleBarChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div
      className={cn('flex items-end justify-between gap-1.5 sm:gap-2', className)}
      style={{ height }}
      role="img"
      aria-label="Grafik batang"
    >
      {data.map((item) => {
        const formattedValue = valueFormatter(item.value);
        const tooltip = resolveTooltip(item, formattedValue);
        const barPx =
          item.value > 0 ? Math.max(8, Math.round((item.value / max) * (height - 44))) : 4;
        const ariaLabel = item.hint ?? `${tooltip.title}: ${tooltip.value}`;

        return (
          <Tooltip key={item.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  'group/chart-col flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5',
                  'rounded-lg px-0.5 pb-0.5 transition-colors',
                  'hover:bg-muted/35 focus-visible:bg-muted/35',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                )}
                aria-label={ariaLabel}
              >
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {item.value > 0 ? formattedValue : ''}
                </span>
                <ChartBar
                  barPx={barPx}
                  item={item}
                  barClassName={barClassName}
                  emptyBarClassName={emptyBarClassName}
                  animate={animate}
                />
                <span className="max-w-full truncate text-center text-[10px] font-medium text-muted-foreground">
                  {item.label}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <ChartTooltipBody tooltip={tooltip} />
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
