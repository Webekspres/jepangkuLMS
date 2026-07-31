'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
import { isMidtransEnabled } from '@/lib/midtrans/config';
import { chargeCoursePayment } from '@/lib/payment-engine/charge-course';
import { listCheckoutMethods } from '@/lib/payment-engine/registry/methods';
import { getPaymentProvider } from '@/lib/payment-engine/service';
import type { CheckoutContext, CheckoutMethodId } from '@/lib/payment-engine/types';
import { buildPaymentSseEvent } from '@/lib/payment/sse-event';
import { publishPaymentEvent } from '@/lib/payment/sse-hub';
import { getPaymentSettings } from '@/lib/payment/settings';
import { prisma } from '@/lib/prisma';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

async function requireUserId() {
  return requireAuthUserWithAnchor();
}

async function buildCourseCheckoutContext(
  userId: string,
  courseSlug: string,
): Promise<{ context: CheckoutContext; course: { id: string; slug: string; title: string; priceIdr: number; isPublished: boolean } } | { error: string }> {
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

  const context: CheckoutContext = {
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
  };

  return { context, course };
}

export type StartCourseCheckoutResult =
  | {
      ok: true;
      course: {
        slug: string;
        title: string;
        priceIdr: number;
        imageUrl: string | null;
      };
      methods: ReturnType<typeof listCheckoutMethods>;
      existingPaymentId: string | null;
      existingPaymentStatus: string | null;
    }
  | { ok: false; message: string };

export async function startCourseCheckout(courseSlug: string): Promise<StartCourseCheckoutResult> {
  const userId = await requireUserId();

  if (!isMidtransEnabled() || getPaymentSettings().checkoutMode !== 'core') {
    return { ok: false, message: 'Checkout Core Midtrans tidak aktif.' };
  }

  const built = await buildCourseCheckoutContext(userId, courseSlug);
  if ('error' in built) return { ok: false, message: built.error };

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: built.course.id } },
    include: { payment: { select: { id: true, status: true } } },
  });

  if (enrollment?.status === 'ACTIVE') {
    return { ok: false, message: 'Kamu sudah terdaftar di kursus ini.' };
  }

  return {
    ok: true,
    course: {
      slug: built.course.slug,
      title: built.course.title,
      priceIdr: built.course.priceIdr,
      imageUrl: built.context.product.imageUrl ?? null,
    },
    methods: listCheckoutMethods(),
    existingPaymentId:
      enrollment?.payment?.status === 'PENDING' ? enrollment.payment.id : null,
    existingPaymentStatus: enrollment?.payment?.status ?? null,
  };
}

export type PayCourseCheckoutResult =
  | { ok: true; paymentId: string; redirectPath: string }
  | { ok: false; message: string };

export async function payCourseCheckout(input: {
  courseSlug: string;
  methodId: CheckoutMethodId;
}): Promise<PayCourseCheckoutResult> {
  const userId = await requireUserId();

  if (!isMidtransEnabled() || getPaymentSettings().checkoutMode !== 'core') {
    return { ok: false, message: 'Checkout Core Midtrans tidak aktif.' };
  }

  const built = await buildCourseCheckoutContext(userId, input.courseSlug);
  if ('error' in built) return { ok: false, message: built.error };

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId: built.course.id } },
    create: {
      userId,
      courseId: built.course.id,
      type: 'COURSE',
      status: 'PENDING',
    },
    update: { status: 'PENDING' },
  });

  const result = await chargeCoursePayment({
    context: built.context,
    methodId: input.methodId,
    enrollmentId: enrollment.id,
  });

  if (!result.ok) return result;

  return {
    ok: true,
    paymentId: result.paymentId,
    redirectPath: STUDENT_ROUTES.pembayaran(result.paymentId),
  };
}

export async function cancelCoursePayment(
  paymentId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = await requireUserId();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { enrollment: { include: { course: { select: { slug: true } } } } },
  });

  if (!payment || payment.enrollment.userId !== userId) {
    return { ok: false, message: 'Pembayaran tidak ditemukan.' };
  }
  if (payment.status !== 'PENDING' && payment.status !== 'CHALLENGE') {
    return { ok: false, message: 'Pembayaran ini tidak bisa dibatalkan.' };
  }

  try {
    await getPaymentProvider('midtrans').cancel?.(payment.orderId);
  } catch {
    // continue — mark canceled locally
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'CANCELED' },
  });

  await publishPaymentEvent(
    buildPaymentSseEvent({
      paymentId: payment.id,
      orderId: payment.orderId,
      status: 'CANCELED',
      enrollmentId: payment.enrollmentId,
      enrollmentStatus: payment.enrollment.status,
      productType: payment.enrollment.type,
      courseSlug: payment.enrollment.course?.slug ?? null,
    }),
  );

  revalidatePath(STUDENT_ROUTES.pembayaran(paymentId));
  return { ok: true };
}

export async function changeCoursePaymentMethod(input: {
  paymentId: string;
  methodId: CheckoutMethodId;
}): Promise<PayCourseCheckoutResult> {
  const userId = await requireUserId();

  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: {
      enrollment: {
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              priceIdr: true,
              isPublished: true,
              coverImageUrl: true,
            },
          },
        },
      },
    },
  });

  if (!payment || payment.enrollment.userId !== userId) {
    return { ok: false, message: 'Pembayaran tidak ditemukan.' };
  }

  if (!['PENDING', 'EXPIRED', 'CANCELED', 'FAILED', 'DENIED'].includes(payment.status)) {
    return { ok: false, message: 'Metode pembayaran tidak bisa diganti untuk status ini.' };
  }

  const course = payment.enrollment.course;
  if (!course) return { ok: false, message: 'Kursus terkait tidak ditemukan.' };

  const built = await buildCourseCheckoutContext(userId, course.slug);
  if ('error' in built) return { ok: false, message: built.error };

  const result = await chargeCoursePayment({
    context: built.context,
    methodId: input.methodId,
    enrollmentId: payment.enrollmentId,
  });

  if (!result.ok) return result;

  revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(userId), 'default');
  return {
    ok: true,
    paymentId: result.paymentId,
    redirectPath: STUDENT_ROUTES.pembayaran(result.paymentId),
  };
}
