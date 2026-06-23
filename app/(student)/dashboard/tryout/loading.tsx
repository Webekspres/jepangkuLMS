import { TryoutSelectionSkeleton } from '@/features/tryout/components/skeletons/tryout-page-skeletons';
import { SkeletonNavBar } from '@/features/student/components/skeletons/skeleton-blocks';

export default function DashboardTryoutLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <SkeletonNavBar />
      <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">
        <TryoutSelectionSkeleton />
      </main>
    </div>
  );
}
