import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { QuizResultView } from '@/features/learning/components/quiz-result-view';
import { getLessonQuizBySlug } from '@/features/learning/lib/queries';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

interface KuisHasilProps {
  params: Promise<{
    lessonSlug: string;
  }>;
  searchParams: Promise<{
    score?: string;
    correct?: string;
    total?: string;
  }>;
}

export default async function KuisHasilPage({ params, searchParams }: KuisHasilProps) {
  const { lessonSlug } = await params;
  const query = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  await syncUserAnchor(userId);

  const quiz = await getLessonQuizBySlug(lessonSlug, userId);
  if (!quiz || quiz.accessDenied || quiz.empty) {
    redirect(STUDENT_ROUTES.kursus);
  }

  const score = Number.parseInt(query.score ?? '0', 10);
  const correct = Number.parseInt(query.correct ?? '0', 10);
  const total = Number.parseInt(query.total ?? String(quiz.questions.length), 10);

  return (
    <QuizResultView
      lessonSlug={quiz.lesson.slug}
      lessonTitle={quiz.lesson.title}
      courseSlug={quiz.lesson.courseSlug}
      score={score}
      correct={correct}
      total={total}
    />
  );
}
