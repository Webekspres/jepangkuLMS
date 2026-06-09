import { SkeletonNavBar } from './skeleton-blocks';
import { DashboardPageSkeleton } from './dashboard-page-skeleton';

/** Full student shell + default dashboard content — layout Suspense fallback. */
export function StudentLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <SkeletonNavBar />
      <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">
        <DashboardPageSkeleton />
      </main>
    </div>
  );
}
