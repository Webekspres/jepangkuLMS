import { notFound } from 'next/navigation';
import { AdminTryoutQuestionsPage } from '@/features/admin-cms/components/admin-tryout-questions-page';
import { renumberTryoutQuestionsForSession } from '@/features/admin-cms/lib/renumber-tryout-questions';
import {
  loadAdminTryoutQuestions,
  loadAdminTryoutSessionDetail,
} from '@/features/admin-cms/lib/load-admin-tryout-questions';
import { uuidSchema } from '@/lib/validations/shared';

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function AdminTryoutQuestionsRoutePage({ params }: PageProps) {
  const { sessionId } = await params;

  const parsedId = uuidSchema.safeParse(sessionId);
  if (!parsedId.success) notFound();

  const session = await loadAdminTryoutSessionDetail(parsedId.data);
  if (!session) notFound();

  await renumberTryoutQuestionsForSession(session.id);

  const questions = await loadAdminTryoutQuestions(session.id);

  return <AdminTryoutQuestionsPage session={session} questions={questions} />;
}
