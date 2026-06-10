import { Skeleton } from '@/components/ui/skeleton';
import {
  SkeletonLeaderboardRow,
  SkeletonPageHeader,
} from './skeleton-blocks';

export function LeaderboardPageSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <SkeletonPageHeader
        aside={
          <div className="grid w-full grid-cols-2 gap-3 sm:min-w-[16rem]">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-7 w-10" />
            </div>
          </div>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        <div className="border-b border-border bg-muted/20 px-4 py-8 sm:px-6">
          <div className="mx-auto flex max-w-lg items-end justify-center gap-3 sm:gap-6">
            {[16, 24, 12].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <Skeleton className="size-12 rounded-full sm:size-14" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="mt-2 w-full rounded-t-xl" style={{ height: `${h * 4}px` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 p-4 sm:p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLeaderboardRow key={i} />
          ))}
        </div>

        <div className="border-t border-border px-4 py-4 sm:px-5">
          <Skeleton className="h-10 w-full rounded-sm" />
        </div>
      </section>

      <Skeleton className="mx-auto h-3 w-48" />
    </div>
  );
}
