import type { Metadata } from 'next';
import { AboutPage } from '@/features/marketing/components';

export const metadata: Metadata = {
  title: 'Tentang Kami — JepangKu LMS',
  description:
    'Profil, visi, dan misi JepangKu LMS — platform belajar bahasa Jepang terstruktur JLPT dengan gamifikasi.',
};

export default function TentangPage() {
  return <AboutPage />;
}
