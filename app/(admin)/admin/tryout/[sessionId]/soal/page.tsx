import { redirect, notFound } from 'next/navigation';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { uuidSchema } from '@/lib/validations/shared';

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

/** Phase 2: legacy per-session soal CMS → compose from bank. */
export default async function AdminTryoutQuestionsRoutePage({ params }: PageProps) {
  const { sessionId } = await params;
  const parsedId = uuidSchema.safeParse(sessionId);
  if (!parsedId.success) notFound();
  redirect(ADMIN_ROUTES.tryoutSessionCompose(parsedId.data));
}
