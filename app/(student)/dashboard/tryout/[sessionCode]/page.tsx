import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TryoutExamWorkspace } from '@/features/tryout/components/tryout-exam-workspace';
import { loadTryoutExam } from '@/features/student/lib/load-dashboard-extras';
import { evaluateTryoutAccess } from '@/features/tryout/lib/tryout-access';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { Button } from '@/components/ui/button';

type PageProps = {
  params: Promise<{ sessionCode: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionCode } = await params;
  return {
    title: `Ujian JLPT — ${sessionCode} — JepangKu LMS`,
    description: 'Simulasi ujian JLPT dengan timer dan bagian terpisah.',
  };
}

export default async function TryoutExamRoutePage({ params }: PageProps) {
  const { sessionCode } = await params;
  const userId = await requireAuthUserWithAnchor();

  const exam = await loadTryoutExam(decodeURIComponent(sessionCode), userId);
  if (!exam) notFound();

  const access = evaluateTryoutAccess({
    isStrictTimeBound: exam.session.isStrictTimeBound,
    scheduledAt: exam.session.scheduledAt,
    timeLimitMinutes: exam.session.timeLimitMinutes,
  });
  if (!access.ok) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Tryout belum dapat diakses</h1>
        <p className="mt-2 text-sm text-muted-foreground">{access.message}</p>
        <Button asChild className="mt-6">
          <Link href={STUDENT_ROUTES.tryout}>Kembali</Link>
        </Button>
      </div>
    );
  }

  if ('enrollmentBlocked' in exam && exam.enrollmentBlocked) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Akses tryout dibatasi</h1>
        <p className="mt-2 text-sm text-muted-foreground">{exam.enrollmentBlocked}</p>
        <Button asChild className="mt-6">
          <Link href={STUDENT_ROUTES.tryout}>Kembali ke daftar tryout</Link>
        </Button>
      </div>
    );
  }

  if (exam.empty) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Soal belum tersedia</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bank soal untuk {exam.session.phaseLabel} level {exam.session.level} masih disiapkan.
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
      level={exam.session.level}
      timeLimitMinutes={exam.session.timeLimitMinutes}
      questions={exam.questions}
    />
  );
}
