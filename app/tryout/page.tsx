import type { Metadata } from 'next';
import { TryoutInfoPage } from '@/features/learning/components';

export const metadata: Metadata = {
  title: 'Tryout JLPT — JepangKu LMS',
  description:
    'Info simulasi ujian JLPT JepangKu: jadwal try out, level N5–N1, dan cara daftar. Ujian interaktif diakses setelah login.',
};

export default function TryoutPage() {
  return <TryoutInfoPage />;
}
