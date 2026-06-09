import { Skeleton } from '@/components/ui/skeleton';
import {
  SkeletonCourseCard,
  SkeletonLeaderboardRow,
  SkeletonSection,
  SkeletonStatCard,
} from './skeleton-blocks';

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6 pb-10 sm:space-y-8">
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-56 sm:w-72" />
            <Skeleton className="h-4 w-48" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-sm sm:w-44" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <SkeletonSection titleWidth="w-36">
        <div className="flex justify-between gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 flex-1 rounded-t-md" />
          ))}
        </div>
      </SkeletonSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonSection titleWidth="w-40">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLeaderboardRow key={i} />
            ))}
          </div>
        </SkeletonSection>

        <SkeletonSection titleWidth="w-28">
          <div className="space-y-4">
            <Skeleton className="mx-auto size-20 rounded-full" />
            <Skeleton className="mx-auto h-4 w-32" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </SkeletonSection>
      </div>

      <SkeletonSection titleWidth="w-44">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCourseCard key={i} />
          ))}
        </div>
      </SkeletonSection>
    </div>
  );
}
