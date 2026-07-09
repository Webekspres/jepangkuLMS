import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCourseCard } from './skeleton-blocks';

export function KursusPageSkeleton() {
  return (
    <div className="pb-10">
      <section className="relative -mx-4 mb-2 overflow-hidden px-4 py-12 text-center md:-mx-8 md:px-8">
        <Skeleton className="mx-auto mb-4 h-9 w-48 rounded-full" />
        <Skeleton className="mx-auto mb-3 h-10 w-full max-w-md" />
        <Skeleton className="mx-auto mb-3 h-10 w-full max-w-sm" />
        <Skeleton className="mx-auto mb-8 h-5 w-full max-w-xl" />
        <Skeleton className="mx-auto h-12 w-full max-w-xl rounded-2xl" />
      </section>

      <div className="flex flex-col items-center gap-4 pb-8 pt-2">
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-16 rounded-full" />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
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
