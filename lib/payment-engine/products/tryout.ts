import type { ProductCheckoutResolveResult } from '@/lib/payment-engine/products/types';
import { prisma } from '@/lib/prisma';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export async function resolveTryoutCheckout(
  userId: string,
  sessionCode: string,
): Promise<ProductCheckoutResolveResult> {
  const session = await prisma.tryoutSession.findUnique({
    where: { code: sessionCode },
    select: {
      id: true,
      code: true,
      title: true,
      priceIdr: true,
      isActive: true,
    },
  });

  if (!session) return { error: 'Sesi tryout tidak ditemukan.' };
  if (!session.isActive) return { error: 'Sesi tryout belum aktif.' };
  if (session.priceIdr <= 0) return { error: 'Tryout ini gratis — daftar tanpa pembayaran.' };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, ssoDisplayName: true, ssoEmail: true, phone: true },
  });

  return {
    context: {
      product: {
        type: 'TRYOUT',
        id: session.id,
        slug: session.code,
        title: session.title,
        imageUrl: null,
      },
      buyer: {
        userId,
        email: user?.ssoEmail,
        name: user?.displayName ?? user?.ssoDisplayName,
        phone: user?.phone,
      },
      pricing: {
        currency: 'IDR',
        listPriceIdr: session.priceIdr,
        discountIdr: 0,
        feesIdr: 0,
        totalIdr: session.priceIdr,
      },
      providerId: 'midtrans',
    },
    productKey: session.code,
    priceIdr: session.priceIdr,
    backHref: STUDENT_ROUTES.tryout,
    successHref: STUDENT_ROUTES.tryoutExam(session.code),
    enrollmentWhere: { userId_tryoutSessionId: { userId, tryoutSessionId: session.id } },
    enrollmentCreate: {
      userId,
      tryoutSessionId: session.id,
      type: 'TRYOUT',
      status: 'PENDING',
    },
  };
}
