import type { Metadata } from 'next';
import { PlacementTestInfoPage } from '@/features/learning/components';

export const metadata: Metadata = {
  title: 'Tes Penempatan JLPT — JepangKu LMS',
  description:
    'Info tes penempatan gratis JepangKu: ketahui level JLPT yang cocok sebelum mulai belajar. Ujian dikerjakan setelah daftar atau masuk.',
};

export default function TesPenempatanPage() {
  return <PlacementTestInfoPage />;
}
