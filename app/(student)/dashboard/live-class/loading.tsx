import { LiveClassPageSkeleton } from '@/features/live-class/components/live-class-page-skeleton';
import { SkeletonNavBar } from '@/features/student/components/skeletons/skeleton-blocks';

export default function LiveClassLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <SkeletonNavBar />
      <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">
        <LiveClassPageSkeleton />
      </main>
    </div>
  );
}
