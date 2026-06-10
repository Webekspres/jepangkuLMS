import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonStatCard } from '@/features/student/components/skeletons/skeleton-blocks';

export function AdminPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30 p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
