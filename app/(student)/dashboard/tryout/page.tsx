import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { TryoutSelectionPage } from '@/features/tryout/components/tryout-selection-page';
import { TryoutExamWorkspace } from '@/features/tryout/components/tryout-exam-workspace';
import { loadTryoutExam, loadTryoutSessions } from '@/features/student/lib/load-dashboard-extras';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Tryout JLPT — JepangKu LMS',
  description: 'Simulasi ujian JLPT interaktif dengan timer dan navigator soal.',
};

type PageProps = {
  searchParams: Promise<{ session?: string; level?: string }>;
};

export default async function DashboardTryoutRoutePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionCode = params.session?.trim();
  const level = params.level?.trim();

  if (!sessionCode && !level) {
    const sessions = await loadTryoutSessions();
    return <TryoutSelectionPage sessions={sessions} />;
  }

  if (!sessionCode || !level) {
    redirect(STUDENT_ROUTES.tryout);
  }

  const exam = await loadTryoutExam(sessionCode, level as 'N5' | 'N4' | 'N3' | 'N2' | 'N1');
  if (!exam) notFound();

  if (exam.empty) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Soal belum tersedia</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bank soal untuk {exam.session.phaseLabel} level {level} masih disiapkan. Coba Fase 1 + N5.
        </p>
        <Button asChild className="mt-6">
          <Link href={STUDENT_ROUTES.tryout}>Kembali</Link>
        </Button>
      </div>
    );
  }

  return (
    <TryoutExamWorkspace
      sessionCode={exam.session.code}
      sessionTitle={exam.session.title}
      level={level}
      timeLimitMinutes={exam.session.timeLimitMinutes}
      questions={exam.questions}
    />
  );
}
