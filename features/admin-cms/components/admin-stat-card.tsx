import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AdminStatCard({
  title,
  value,
  description,
  delta,
  icon: Icon,
  accentClassName,
}: {
  title: string;
  value: string | number;
  description?: string;
  /** Short period delta, e.g. "+3 (7 hari)" */
  delta?: string;
  icon: LucideIcon;
  accentClassName?: string;
}) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary',
            accentClassName,
          )}
        >
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
        {delta ? (
          <p className="mt-1 text-xs font-medium text-emerald-700">{delta}</p>
        ) : null}
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
