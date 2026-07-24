/** Chart colors from CSS theme tokens (globals.css --chart-*). */
export const DASHBOARD_CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

export const CHART_PRIMARY = 'var(--chart-1)';
export const CHART_SECONDARY = 'var(--chart-2)';
export const CHART_ACCENT = 'var(--chart-3)';
export const CHART_MUTED_GRID = 'var(--border)';
export const CHART_AXIS = 'var(--muted-foreground)';

export const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 } as const;
