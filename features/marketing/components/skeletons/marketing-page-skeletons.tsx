import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonNavBar, SkeletonPageHeader } from '@/features/student/components/skeletons/skeleton-blocks';

export function MarketingLandingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <SkeletonNavBar />
      <div className="bg-brand-hero-navy px-4 py-20 sm:py-28">
        <div className="container mx-auto max-w-3xl space-y-4 text-center">
          <Skeleton className="mx-auto h-4 w-40 bg-white/20" />
          <Skeleton className="mx-auto h-12 w-full max-w-xl bg-white/20" />
          <Skeleton className="mx-auto h-5 w-full max-w-lg bg-white/15" />
          <div className="flex justify-center gap-3 pt-4">
            <Skeleton className="h-11 w-36 rounded-sm bg-white/25" />
            <Skeleton className="h-11 w-36 rounded-sm bg-white/15" />
          </div>
        </div>
      </div>
      <div className="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-3 md:px-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6">
            <Skeleton className="mb-3 size-10 rounded-xl" />
            <Skeleton className="mb-2 h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketingStaticPageSkeleton() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-8 md:px-8 md:py-12">
      <SkeletonPageHeader subtitle />
      <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
