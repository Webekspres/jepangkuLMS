import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s — JepangKu LMS',
    default: 'JepangKu LMS — Platform Belajar Bahasa Jepang Interaktif',
  },
  description:
    'Kuasai Bahasa Jepang dari N5 hingga N1. Video lesson, JLPT try out, gamifikasi XP, dan live class bersama sensei berpengalaman.',
};

/** Public marketing routes — navbar/footer diatur per halaman di features/marketing & features/learning. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full flex flex-col bg-background">{children}</div>;
}
