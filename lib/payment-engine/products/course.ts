import type { ProductCheckoutResolveResult } from '@/lib/payment-engine/products/types';
import { prisma } from '@/lib/prisma';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export async function resolveCourseCheckout(
  userId: string,
  courseSlug: string,
): Promise<ProductCheckoutResolveResult> {
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      priceIdr: true,
      isPublished: true,
      coverImageUrl: true,
    },
  });

  if (!course) return { error: 'Kursus tidak ditemukan.' };
  if (!course.isPublished) return { error: 'Kursus belum tersedia.' };
  if (course.priceIdr <= 0) return { error: 'Kursus ini gratis — daftar tanpa pembayaran.' };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, ssoDisplayName: true, ssoEmail: true, phone: true },
  });

  return {
    context: {
      product: {
        type: 'COURSE',
        id: course.id,
        slug: course.slug,
        title: course.title,
        imageUrl: course.coverImageUrl,
      },
      buyer: {
        userId,
        email: user?.ssoEmail,
        name: user?.displayName ?? user?.ssoDisplayName,
        phone: user?.phone,
      },
      pricing: {
        currency: 'IDR',
        listPriceIdr: course.priceIdr,
        discountIdr: 0,
        feesIdr: 0,
        totalIdr: course.priceIdr,
      },
      providerId: 'midtrans',
    },
    productKey: course.slug,
    priceIdr: course.priceIdr,
    backHref: STUDENT_ROUTES.kursusDetail(course.slug),
    successHref: STUDENT_ROUTES.kursusDetail(course.slug),
    enrollmentWhere: { userId_courseId: { userId, courseId: course.id } },
    enrollmentCreate: {
      userId,
      courseId: course.id,
      type: 'COURSE',
      status: 'PENDING',
    },
  };
}
