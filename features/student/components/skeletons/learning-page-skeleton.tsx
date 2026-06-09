import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonSection } from '@/features/student/components/skeletons/skeleton-blocks';

export function LessonPageSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <Skeleton className="mb-2 h-3 w-24" />
        <Skeleton className="mb-3 h-8 w-2/3" />
        <Skeleton className="h-4 w-48" />
      </section>

      <Skeleton className="aspect-video w-full rounded-2xl" />

      <SkeletonSection titleWidth="w-36">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </SkeletonSection>
    </div>
  );
}

export function QuizPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 flex-1 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Skeleton className="mb-6 h-6 w-full" />
        <Skeleton className="mb-2 h-6 w-4/5" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </section>

      <div className="flex justify-between gap-3">
        <Skeleton className="h-10 w-28 rounded-sm" />
        <Skeleton className="h-10 w-28 rounded-sm" />
      </div>
    </div>
  );
}
