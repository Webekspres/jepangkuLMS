import type { Metadata } from 'next';
import { LearningGuidePage } from '@/features/marketing/components/learning-guide-page';

export const metadata: Metadata = {
  title: 'Cara Belajar — JepangKu LMS',
  description:
    'Panduan belajar di JepangKu: alur lesson & kuis, level JLPT N5–N1, dan sistem XP gamifikasi.',
};

export default function CaraBelajarPage() {
  return <LearningGuidePage />;
}
