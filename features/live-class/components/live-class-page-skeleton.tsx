import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCourseCard } from '@/features/student/components/skeletons/skeleton-blocks';

export function LiveClassPageSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-lg" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCourseCard key={i} />
        ))}
      </div>
    </div>
  );
}
