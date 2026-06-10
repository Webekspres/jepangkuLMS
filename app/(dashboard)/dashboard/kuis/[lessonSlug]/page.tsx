import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getLessonQuizBySlug } from '@/features/learning/lib/queries';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

interface KuisWorkspaceProps {
  params: Promise<{
    lessonSlug: string;
  }>;
}

/** Deep link lama — arahkan ke tab Quiz di halaman belajar (inline, tanpa halaman terpisah). */
export default async function KuisWorkspacePage({ params }: KuisWorkspaceProps) {
  const { lessonSlug } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  await syncUserAnchor(userId);

  const quiz = await getLessonQuizBySlug(lessonSlug, userId);

  if (!quiz) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold text-foreground">Kuis tidak ditemukan</h1>
        <Button asChild className="mt-6">
          <Link href={STUDENT_ROUTES.kursus}>Ke kursus saya</Link>
        </Button>
      </div>
    );
  }

  if (quiz.accessDenied) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold text-foreground">Akses kursus diperlukan</h1>
        <Button asChild className="mt-6">
          <Link href={STUDENT_ROUTES.kursus}>Ke kursus saya</Link>
        </Button>
      </div>
    );
  }

  if (quiz.empty) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold text-foreground">Belum ada soal kuis</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Lesson ini belum memiliki bank soal.
        </p>
        <Button asChild className="mt-6">
          <Link href={STUDENT_ROUTES.kursus}>Ke kursus saya</Link>
        </Button>
      </div>
    );
  }

  redirect(`${STUDENT_ROUTES.belajar(quiz.lesson.courseSlug, lessonSlug)}?tab=quiz`);
}
