import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <Skeleton className="mb-3 size-9 rounded-xl" />
      <Skeleton className="mb-2 h-7 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function SkeletonSection({
  titleWidth = 'w-32',
  className,
  children,
}: {
  titleWidth?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className={cn('h-5', titleWidth)} />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      {children}
    </section>
  );
}

export function SkeletonPageHeader({
  subtitle = true,
  aside,
}: {
  subtitle?: boolean;
  aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-48 sm:w-64" />
          {subtitle ? <Skeleton className="h-4 w-full max-w-md" /> : null}
        </div>
        {aside}
      </div>
    </section>
  );
}

export function SkeletonNavBar() {
  return (
    <div className="sticky top-0 z-50 border-b border-border bg-header shadow-sm backdrop-blur-md dark:backdrop-blur-none">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3.5 md:px-8">
        <Skeleton className="h-9 w-28 rounded-md" />
        <div className="hidden items-center gap-6 lg:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Skeleton className="h-8 w-32 rounded-sm" />
          <Skeleton className="size-9 rounded-full" />
        </div>
        <Skeleton className="size-8 rounded-lg lg:hidden" />
      </div>
    </div>
  );
}

export function SkeletonLeaderboardRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2.5">
      <Skeleton className="size-7 shrink-0 rounded-lg" />
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

export function SkeletonCourseCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
