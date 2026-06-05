import type { Metadata } from 'next';
import { CoursesCatalogPage } from '@/features/learning/components';

export const metadata: Metadata = {
  title: 'Katalog Kursus — JepangKu LMS',
  description:
    'Jelajahi kursus bahasa Jepang dari N5 hingga N1. Filter berdasarkan level JLPT dan kategori — video lesson, flashcard, dan quiz interaktif.',
};

export default function KursusCatalogPage() {
  return <CoursesCatalogPage />;
}
