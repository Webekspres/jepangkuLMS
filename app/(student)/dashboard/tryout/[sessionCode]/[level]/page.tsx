import { redirect } from 'next/navigation';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

type PageProps = {
  params: Promise<{ sessionCode: string; level: string }>;
};

/** Legacy URL with level segment — redirect to session-only route. */
export default async function LegacyTryoutExamLevelRoutePage({ params }: PageProps) {
  const { sessionCode } = await params;
  redirect(STUDENT_ROUTES.tryoutExam(decodeURIComponent(sessionCode)));
}
