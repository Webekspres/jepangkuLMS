import type { Metadata } from 'next';
import { LiveClassPage } from '@/features/live-class/components/live-class-page';
import { loadPublishedLiveClasses } from '@/features/student/lib/load-dashboard-extras';

export const metadata: Metadata = {
  title: 'Live Class — JepangKu LMS',
  description: 'Jadwal kelas live bahasa Jepang via Zoom bersama sensei berpengalaman.',
};

export default async function DashboardLiveClassRoutePage() {
  const classes = await loadPublishedLiveClasses();
  return <LiveClassPage classes={classes} />;
}
