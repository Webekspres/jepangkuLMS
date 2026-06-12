import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LessonWorkspace } from '@/features/learning/components/lesson-workspace';
import { getLessonWorkspace } from '@/features/learning/lib/queries';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

interface BelajarPageProps {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function BelajarPage({ params, searchParams }: BelajarPageProps) {
  const { courseSlug, lessonSlug } = await params;
  const { tab } = await searchParams;
  let userId: string;
  try {
    userId = await requireAuthUserId();
  } catch {
    redirect('/sign-in');
  }

  const workspace = await getLessonWorkspace(userId, courseSlug, lessonSlug);

  if (!workspace) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold text-foreground">Pelajaran tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kursus atau lesson yang diminta tidak ada.
        </p>
        <Button asChild className="mt-6">
          <Link href={STUDENT_ROUTES.kursus}>Ke kursus saya</Link>
        </Button>
      </div>
    );
  }

  if (workspace.accessDenied) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold text-foreground">Akses kursus diperlukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Daftar kursus ini terlebih dahulu untuk membuka materi belajar.
        </p>
        <Button asChild className="mt-6">
          <Link href={STUDENT_ROUTES.kursus}>Daftar / buka kursus</Link>
        </Button>
      </div>
    );
  }

  return (
    <LessonWorkspace
      course={workspace.course}
      lesson={workspace.lesson}
      syllabus={workspace.syllabus}
      materials={workspace.materials}
      questions={workspace.questions}
      initialTab={tab === 'flashcard' || tab === 'quiz' ? tab : 'video'}
    />
  );
}
