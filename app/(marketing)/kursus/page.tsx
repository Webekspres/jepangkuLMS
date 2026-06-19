import type { Metadata } from 'next';
import { CoursesCatalogPage } from '@/features/learning/components';
import { loadMarketingCatalog } from '@/features/learning/lib/load-marketing-courses';

export const metadata: Metadata = {
  title: 'Katalog Kursus — JepangKu LMS',
  description:
    'Jelajahi kursus bahasa Jepang dari N5 hingga N1. Filter berdasarkan level JLPT dan kategori — video lesson, flashcard, dan quiz interaktif.',
};

export default async function KursusCatalogPage() {
  const courses = await loadMarketingCatalog();
  return <CoursesCatalogPage courses={courses} />;
}
