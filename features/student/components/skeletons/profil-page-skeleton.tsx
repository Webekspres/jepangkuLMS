import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonStatCard } from './skeleton-blocks';

export function ProfilPageSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-6 sm:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Skeleton className="size-24 rounded-2xl" />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <Skeleton className="mx-auto h-8 w-48 sm:mx-0" />
              <Skeleton className="mx-auto h-4 w-56 sm:mx-0" />
              <Skeleton className="mx-auto h-4 w-40 sm:mx-0" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="size-16 rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
