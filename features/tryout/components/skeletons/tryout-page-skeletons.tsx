import { Skeleton } from '@/components/ui/skeleton';

export function TryoutSelectionSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="mx-auto h-12 w-56 rounded-sm" />
    </div>
  );
}

export function TryoutExamSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl p-4">
        <Skeleton className="min-h-[60vh] w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function TryoutResultSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-52 w-full rounded-2xl" />
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-2xl" />
      ))}
    </div>
  );
}
