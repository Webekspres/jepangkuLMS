import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCourseCard } from './skeleton-blocks';

export function KursusSayaPageSkeleton() {
  return (
    <div className="pb-10">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-44 md:h-10" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="mb-6 flex gap-6 border-b border-border pb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-28" />
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCourseCard key={i} />
        ))}
      </div>

      <Skeleton className="mt-10 h-48 w-full rounded-2xl" />
    </div>
  );
}
