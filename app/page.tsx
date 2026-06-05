import type { Metadata } from 'next';
import { LandingPage } from '@/features/marketing/components';

export const metadata: Metadata = {
  title: 'JepangKu LMS — Platform Belajar Bahasa Jepang Interaktif',
  description:
    'Kuasai Bahasa Jepang dari N5 hingga N1. Video lesson, JLPT try out, gamifikasi XP & badge, dan live class bersama sensei berpengalaman.',
};

export default function Home() {
  return <LandingPage />;
}
