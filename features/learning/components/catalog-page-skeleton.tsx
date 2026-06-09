import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCourseCard, SkeletonNavBar } from '@/features/student/components/skeletons/skeleton-blocks';

export function CatalogPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <SkeletonNavBar />
      <main className="container mx-auto space-y-8 px-4 py-8 md:px-8">
        <section className="space-y-3 text-center">
          <Skeleton className="mx-auto h-3 w-24" />
          <Skeleton className="mx-auto h-10 w-64" />
          <Skeleton className="mx-auto h-4 w-full max-w-xl" />
        </section>

        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-16 rounded-full" />
          ))}
        </div>

        <Skeleton className="mx-auto h-11 w-full max-w-md rounded-xl" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCourseCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
