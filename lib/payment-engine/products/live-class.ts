import type { ProductCheckoutResolveResult } from '@/lib/payment-engine/products/types';
import { prisma } from '@/lib/prisma';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export async function resolveLiveClassCheckout(
  userId: string,
  liveClassId: string,
): Promise<ProductCheckoutResolveResult> {
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    select: {
      id: true,
      title: true,
      priceIdr: true,
      isPublished: true,
      coverImageUrl: true,
      maxSlots: true,
      filledSlots: true,
    },
  });

  if (!liveClass) return { error: 'Live Class tidak ditemukan.' };
  if (!liveClass.isPublished) return { error: 'Live Class belum tersedia.' };
  if (liveClass.priceIdr <= 0) return { error: 'Live Class ini gratis — daftar tanpa pembayaran.' };
  if (liveClass.filledSlots >= liveClass.maxSlots) {
    return { error: 'Kelas sudah penuh.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, ssoDisplayName: true, ssoEmail: true, phone: true },
  });

  return {
    context: {
      product: {
        type: 'LIVE_CLASS',
        id: liveClass.id,
        slug: liveClass.id,
        title: liveClass.title,
        imageUrl: liveClass.coverImageUrl,
      },
      buyer: {
        userId,
        email: user?.ssoEmail,
        name: user?.displayName ?? user?.ssoDisplayName,
        phone: user?.phone,
      },
      pricing: {
        currency: 'IDR',
        listPriceIdr: liveClass.priceIdr,
        discountIdr: 0,
        feesIdr: 0,
        totalIdr: liveClass.priceIdr,
      },
      providerId: 'midtrans',
    },
    productKey: liveClass.id,
    priceIdr: liveClass.priceIdr,
    backHref: STUDENT_ROUTES.liveClassDetail(liveClass.id),
    successHref: STUDENT_ROUTES.liveClassDetail(liveClass.id),
    enrollmentWhere: { userId_liveClassId: { userId, liveClassId: liveClass.id } },
    enrollmentCreate: {
      userId,
      liveClassId: liveClass.id,
      type: 'LIVE_CLASS',
      status: 'PENDING',
    },
  };
}
