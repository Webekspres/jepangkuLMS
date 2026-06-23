import { redirect } from 'next/navigation';
import { QuizResultView } from '@/features/learning/components/quiz-result-view';
import { getLatestQuizAttempt, getLessonQuizBySlug } from '@/features/learning/lib/queries';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
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
  let userId: string;
  try {
    userId = await requireAuthUserId();
  } catch {
    redirect('/sign-in');
  }

  const quiz = await getLessonQuizBySlug(lessonSlug, userId);
  if (!quiz || quiz.accessDenied || quiz.empty) {
    redirect(STUDENT_ROUTES.kursus);
  }

  const total = quiz.questions.length;
  const attempt = await getLatestQuizAttempt(userId, quiz.lesson.id);

  const score = attempt?.score ?? Number.parseInt(query.score ?? '0', 10);
  const correct =
    attempt && total > 0
      ? Math.round((attempt.score / 100) * total)
      : Number.parseInt(query.correct ?? '0', 10);
  const resolvedTotal =
    total > 0 ? total : Number.parseInt(query.total ?? '0', 10);

  return (
    <QuizResultView
      lessonSlug={quiz.lesson.slug}
      lessonTitle={quiz.lesson.title}
      courseSlug={quiz.lesson.courseSlug}
      score={score}
      correct={correct}
      total={resolvedTotal}
    />
  );
}
