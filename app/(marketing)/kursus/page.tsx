import type { Metadata } from 'next';
import { CoursesCatalogPage } from '@/features/learning/components';
import {
  loadMarketingLiveClassCovers,
  loadMarketingTryoutCovers,
} from '@/features/learning/lib/load-marketing-catalog-extras';
import { loadMarketingCatalog } from '@/features/learning/lib/load-marketing-courses';

/** Render at request time — `next build` (CI/Docker) has no PostgreSQL. Data cached via unstable_cache. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Katalog Kursus — JepangKu LMS',
  description:
    'Jelajahi kursus bahasa Jepang dari N5 hingga N1. Filter berdasarkan level JLPT dan kategori — video lesson, flashcard, dan quiz interaktif.',
};

export default async function KursusCatalogPage() {
  const [courses, liveClasses, tryouts] = await Promise.all([
    loadMarketingCatalog(),
    loadMarketingLiveClassCovers(),
    loadMarketingTryoutCovers(),
  ]);

  return (
    <CoursesCatalogPage
      courses={courses}
      liveClasses={liveClasses}
      tryouts={tryouts}
    />
  );
}
