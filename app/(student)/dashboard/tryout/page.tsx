import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { TryoutSelectionPage } from '@/features/tryout/components/tryout-selection-page';
import { loadTryoutSessions } from '@/features/student/lib/load-dashboard-extras';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export const metadata: Metadata = {
  title: 'Tryout JLPT — JepangKu LMS',
  description: 'Simulasi ujian JLPT interaktif dengan timer dan navigator soal.',
};

type PageProps = {
  searchParams: Promise<{ session?: string; level?: string }>;
};

/** Legacy query URL → path-based exam route */
export default async function DashboardTryoutRoutePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionCode = params.session?.trim();
  const level = params.level?.trim();

  if (sessionCode && level) {
    redirect(STUDENT_ROUTES.tryoutExam(sessionCode, level));
  }

  const sessions = await loadTryoutSessions();
  return <TryoutSelectionPage sessions={sessions} />;
}
