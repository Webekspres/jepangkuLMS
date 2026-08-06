'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
import { isMidtransEnabled } from '@/lib/midtrans/config';
import { chargeProductPayment } from '@/lib/payment-engine/charge-product';
import {
  checkoutPathFor,
  resolveProductCheckout,
} from '@/lib/payment-engine/products';
import { listCheckoutMethods } from '@/lib/payment-engine/registry/methods';
import { applyProviderPaymentEvent } from '@/lib/payment-engine/status/apply-event';
import { getPaymentProvider } from '@/lib/payment-engine/service';
import type { CheckoutMethodId, CheckoutProductType } from '@/lib/payment-engine/types';
import {
  closePendingEnrollmentForTerminalPayment,
} from '@/lib/payment/close-pending-enrollment';
import { buildPaymentSseEvent } from '@/lib/payment/sse-event';
import { publishPaymentEvent } from '@/lib/payment/sse-hub';
import { getPaymentSettings } from '@/lib/payment/settings';
import { prisma } from '@/lib/prisma';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

async function requireUserId() {
  return requireAuthUserWithAnchor();
}

function assertCoreCheckout() {
  return isMidtransEnabled() && getPaymentSettings().checkoutMode === 'core';
}

function productKeyFromEnrollment(enrollment: {
  type: CheckoutProductType;
  course?: { slug: string } | null;
  liveClass?: { id: string } | null;
  tryoutSession?: { code: string } | null;
}): string | null {
  if (enrollment.type === 'COURSE') return enrollment.course?.slug ?? null;
  if (enrollment.type === 'LIVE_CLASS') return enrollment.liveClass?.id ?? null;
  return enrollment.tryoutSession?.code ?? null;
}

export type StartCheckoutResult =
  | {
      ok: true;
      product: {
        type: CheckoutProductType;
        key: string;
        title: string;
        priceIdr: number;
        imageUrl: string | null;
        backHref: string;
        successHref: string;
      };
      methods: ReturnType<typeof listCheckoutMethods>;
      existingPaymentId: string | null;
      existingPaymentStatus: string | null;
    }
  | { ok: false; message: string };

export async function startCheckout(input: {
  productType: CheckoutProductType;
  productKey: string;
}): Promise<StartCheckoutResult> {
  const userId = await requireUserId();

  if (!assertCoreCheckout()) {
    return { ok: false, message: 'Checkout Core Midtrans tidak aktif.' };
  }

  const built = await resolveProductCheckout(userId, input.productType, input.productKey);
  if ('error' in built) return { ok: false, message: built.error };

  const enrollment = await prisma.enrollment.findUnique({
    where: built.enrollmentWhere,
    include: { payment: { select: { id: true, status: true } } },
  });

  if (enrollment?.status === 'ACTIVE') {
    return { ok: false, message: 'Kamu sudah punya akses ke produk ini.' };
  }

  return {
    ok: true,
    product: {
      type: built.context.product.type,
      key: built.productKey,
      title: built.context.product.title,
      priceIdr: built.priceIdr,
      imageUrl: built.context.product.imageUrl ?? null,
      backHref: built.backHref,
      successHref: built.successHref,
    },
    methods: listCheckoutMethods(),
    existingPaymentId:
      enrollment?.payment?.status === 'PENDING' ? enrollment.payment.id : null,
    existingPaymentStatus: enrollment?.payment?.status ?? null,
  };
}

export type PayCheckoutResult =
  | { ok: true; paymentId: string; redirectPath: string }
  | { ok: false; message: string };

export async function payCheckout(input: {
  productType: CheckoutProductType;
  productKey: string;
  methodId: CheckoutMethodId;
}): Promise<PayCheckoutResult> {
  const userId = await requireUserId();

  if (!assertCoreCheckout()) {
    return { ok: false, message: 'Checkout Core Midtrans tidak aktif.' };
  }

  const built = await resolveProductCheckout(userId, input.productType, input.productKey);
  if ('error' in built) return { ok: false, message: built.error };

  const enrollment = await prisma.enrollment.upsert({
    where: built.enrollmentWhere,
    create: built.enrollmentCreate,
    update: { status: 'PENDING' },
  });

  const result = await chargeProductPayment({
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

export async function cancelPayment(
  paymentId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = await requireUserId();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      enrollment: {
        include: {
          course: { select: { slug: true } },
          liveClass: { select: { id: true } },
          tryoutSession: { select: { code: true } },
        },
      },
    },
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

  const closed = await closePendingEnrollmentForTerminalPayment({
    enrollmentId: payment.enrollmentId,
    actorUserId: userId,
  });

  await publishPaymentEvent(
    buildPaymentSseEvent({
      paymentId: payment.id,
      orderId: payment.orderId,
      status: 'CANCELED',
      enrollmentId: payment.enrollmentId,
      enrollmentStatus: payment.enrollment.status,
      productType: payment.enrollment.type,
      productKey: productKeyFromEnrollment(payment.enrollment),
    }),
  );

  revalidatePath(STUDENT_ROUTES.pembayaran(paymentId));
  for (const path of closed.revalidatePaths) {
    revalidatePath(path);
  }
  revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(userId), 'default');
  return { ok: true };
}

export async function changePaymentMethod(input: {
  paymentId: string;
  methodId: CheckoutMethodId;
}): Promise<PayCheckoutResult> {
  const userId = await requireUserId();

  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: {
      enrollment: {
        include: {
          course: { select: { slug: true } },
          liveClass: { select: { id: true } },
          tryoutSession: { select: { code: true } },
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

  const productKey = productKeyFromEnrollment(payment.enrollment);
  if (!productKey) return { ok: false, message: 'Produk terkait tidak ditemukan.' };

  const built = await resolveProductCheckout(userId, payment.enrollment.type, productKey);
  if ('error' in built) return { ok: false, message: built.error };

  const result = await chargeProductPayment({
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

export async function syncPaymentStatus(
  paymentId: string,
): Promise<{ ok: true; status: string } | { ok: false; message: string }> {
  const userId = await requireUserId();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { enrollment: { select: { userId: true } } },
  });

  if (!payment || payment.enrollment.userId !== userId) {
    return { ok: false, message: 'Pembayaran tidak ditemukan.' };
  }

  try {
    const result = await applyProviderPaymentEvent({ externalOrderId: payment.orderId });
    revalidatePath(STUDENT_ROUTES.pembayaran(paymentId));
    return { ok: true, status: result.status };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Gagal menyinkronkan status.',
    };
  }
}

/** Course aliases — thin wrappers for existing call sites. */
export async function startCourseCheckout(courseSlug: string) {
  const result = await startCheckout({ productType: 'COURSE', productKey: courseSlug });
  if (!result.ok) return result;
  return {
    ok: true as const,
    course: {
      slug: result.product.key,
      title: result.product.title,
      priceIdr: result.product.priceIdr,
      imageUrl: result.product.imageUrl,
    },
    methods: result.methods,
    existingPaymentId: result.existingPaymentId,
    existingPaymentStatus: result.existingPaymentStatus,
  };
}

export async function payCourseCheckout(input: {
  courseSlug: string;
  methodId: CheckoutMethodId;
}) {
  return payCheckout({
    productType: 'COURSE',
    productKey: input.courseSlug,
    methodId: input.methodId,
  });
}

export async function cancelCoursePayment(paymentId: string) {
  return cancelPayment(paymentId);
}

export async function changeCoursePaymentMethod(input: {
  paymentId: string;
  methodId: CheckoutMethodId;
}) {
  return changePaymentMethod(input);
}

export { checkoutPathFor };
