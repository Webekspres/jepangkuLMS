import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCourseCard, SkeletonPageHeader } from './skeleton-blocks';

export function KursusPageSkeleton() {
  return (
    <div className="space-y-8 pb-8">
      <SkeletonPageHeader
        aside={
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-sm" />
            <Skeleton className="h-10 w-24 rounded-sm" />
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-14 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-xl sm:w-64" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCourseCard key={i} />
        ))}
      </div>
    </div>
  );
}
