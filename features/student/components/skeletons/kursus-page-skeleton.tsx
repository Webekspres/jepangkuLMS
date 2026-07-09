import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCourseCard } from './skeleton-blocks';

export function KursusPageSkeleton() {
  return (
    <div className="pb-10">
      <section className="relative left-1/2 mb-2 w-screen max-w-[100vw] -translate-x-1/2 -mt-6 overflow-hidden md:-mt-8">
        <Skeleton className="h-64 w-full rounded-none sm:h-72" />
      </section>

      <div className="flex flex-col items-center gap-4 pb-8 pt-2">
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-16 rounded-full" />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCourseCard key={i} />
        ))}
      </div>
    </div>
  );
}
