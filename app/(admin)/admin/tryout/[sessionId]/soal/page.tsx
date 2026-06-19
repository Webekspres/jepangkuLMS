import { notFound } from 'next/navigation';
import type { LevelJLPT } from '@prisma/client';
import { AdminTryoutQuestionsPage } from '@/features/admin-cms/components/admin-tryout-questions-page';
import {
  loadAdminTryoutQuestionCounts,
  loadAdminTryoutQuestions,
  loadAdminTryoutSessionDetail,
} from '@/features/admin-cms/lib/load-admin-tryout-questions';
import { uuidSchema } from '@/lib/validations/shared';

const LEVELS: LevelJLPT[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

type PageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ level?: string }>;
};

export default async function AdminTryoutQuestionsRoutePage({ params, searchParams }: PageProps) {
  const { sessionId } = await params;
  const { level: levelParam } = await searchParams;

  const parsedId = uuidSchema.safeParse(sessionId);
  if (!parsedId.success) notFound();

  const session = await loadAdminTryoutSessionDetail(parsedId.data);
  if (!session) notFound();

  const level = LEVELS.includes(levelParam as LevelJLPT) ? (levelParam as LevelJLPT) : 'N5';
  const [questions, levelCounts] = await Promise.all([
    loadAdminTryoutQuestions(session.id, level),
    loadAdminTryoutQuestionCounts(session.id),
  ]);

  return (
    <AdminTryoutQuestionsPage
      session={session}
      initialLevel={level}
      questions={questions}
      levelCounts={levelCounts}
    />
  );
}
