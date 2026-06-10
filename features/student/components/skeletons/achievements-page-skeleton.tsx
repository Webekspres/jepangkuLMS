import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonPageHeader, SkeletonStatCard } from './skeleton-blocks';

export function AchievementsPageSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <SkeletonPageHeader />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-3">
              <Skeleton className="mx-auto mb-3 size-14 rounded-2xl" />
              <Skeleton className="mx-auto mb-1 h-4 w-24" />
              <Skeleton className="mx-auto h-3 w-16" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
