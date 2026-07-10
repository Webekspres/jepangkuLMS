import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { prisma } from '@/lib/prisma';

/** @deprecated Session compose retired — redirect to Paket Soal. */
export default async function AdminTryoutComposeRoutePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await prisma.tryoutSession.findUnique({
    where: { id: sessionId },
    select: { questionSetId: true },
  });
  if (session?.questionSetId) {
    redirect(ADMIN_ROUTES.tryoutPaketDetail(session.questionSetId));
  }
  redirect(ADMIN_ROUTES.tryoutPaket);
}
