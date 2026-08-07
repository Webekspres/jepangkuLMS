'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
import { getCheckoutMode, isMidtransEnabled } from '@/lib/midtrans/config';
import { chargeProductPayment } from '@/lib/payment-engine/charge-product';
import { chargeSnapProductPayment } from '@/lib/payment-engine/charge-snap-product';
import {
  checkoutPathFor,
  resolveProductCheckout,
} from '@/lib/payment-engine/products';
import { listCheckoutMethods } from '@/lib/payment-engine/registry/methods';
import { applyProviderPaymentEvent } from '@/lib/payment-engine/status/apply-event';
import { getPaymentProvider } from '@/lib/payment-engine/service';
import type { CheckoutMethodId, CheckoutProductType, PaymentMethodMeta } from '@/lib/payment-engine/types';
import {
  closePendingEnrollmentForTerminalPayment,
} from '@/lib/payment/close-pending-enrollment';
import { getPaymentSettings } from '@/lib/payment/settings';
import { buildPaymentSseEvent } from '@/lib/payment/sse-event';
import { publishPaymentEvent } from '@/lib/payment/sse-hub';
import { prisma } from '@/lib/prisma';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

async function requireUserId() {
  return requireAuthUserWithAnchor();
}

function assertMidtransCheckout() {
  return isMidtransEnabled();
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
      checkoutMode: 'snap' | 'core';
      product: {
        type: CheckoutProductType;
        key: string;
        title: string;
        priceIdr: number;
        imageUrl: string | null;
        backHref: string;
        successHref: string;
      };
      methods: PaymentMethodMeta[];
      existingPaymentId: string | null;
      existingPaymentStatus: string | null;
      midtransClientKey: string | null;
      midtransSnapUrl: string | null;
    }
  | { ok: false; message: string };

export async function startCheckout(input: {
  productType: CheckoutProductType;
  productKey: string;
}): Promise<StartCheckoutResult> {
  const userId = await requireUserId();

  if (!assertMidtransCheckout()) {
    return { ok: false, message: 'Checkout Midtrans tidak aktif.' };
  }

  const checkoutMode = getCheckoutMode();
  const paymentSettings = getPaymentSettings();

  const built = await resolveProductCheckout(userId, input.productType, input.productKey);
  if ('error' in built) return { ok: false, message: built.error };

  const enrollment = await prisma.enrollment.findUnique({
    where: built.enrollmentWhere,
    include: { payment: { select: { id: true, status: true } } },
  });

  if (enrollment?.status === 'ACTIVE') {
    return { ok: false, message: 'Kamu sudah punya akses ke produk ini.' };
  }

  const methods = checkoutMode === 'core' ? await listCheckoutMethods() : [];

  return {
    ok: true,
    checkoutMode,
    product: {
      type: built.context.product.type,
      key: built.productKey,
      title: built.context.product.title,
      priceIdr: built.priceIdr,
      imageUrl: built.context.product.imageUrl ?? null,
      backHref: built.backHref,
      successHref: built.successHref,
    },
    methods,
    existingPaymentId:
      enrollment?.payment?.status === 'PENDING' || enrollment?.payment?.status === 'CHALLENGE'
        ? enrollment.payment.id
        : null,
    existingPaymentStatus: enrollment?.payment?.status ?? null,
    midtransClientKey: paymentSettings.midtransClientKey,
    midtransSnapUrl: paymentSettings.midtransSnapUrl,
  };
}

export type PayCheckoutResult =
  | { ok: true; paymentId: string; redirectPath: string; snapToken?: string }
  | { ok: false; message: string };

/** Core checkout — requires methodId. */
export async function payCheckout(input: {
  productType: CheckoutProductType;
  productKey: string;
  methodId: CheckoutMethodId;
}): Promise<PayCheckoutResult> {
  const userId = await requireUserId();

  if (!assertMidtransCheckout()) {
    return { ok: false, message: 'Checkout Midtrans tidak aktif.' };
  }
  if (getCheckoutMode() !== 'core') {
    return { ok: false, message: 'Mode checkout bukan Core. Gunakan pembayaran Snap.' };
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

/** Snap checkout — product-agnostic; no methodId (Snap Preferences). */
export async function paySnapCheckout(input: {
  productType: CheckoutProductType;
  productKey: string;
}): Promise<PayCheckoutResult> {
  const userId = await requireUserId();

  if (!assertMidtransCheckout()) {
    return { ok: false, message: 'Checkout Midtrans tidak aktif.' };
  }
  if (getCheckoutMode() !== 'snap') {
    return { ok: false, message: 'Mode checkout bukan Snap. Gunakan checkout Core.' };
  }

  const built = await resolveProductCheckout(userId, input.productType, input.productKey);
  if ('error' in built) return { ok: false, message: built.error };

  const enrollment = await prisma.enrollment.upsert({
    where: built.enrollmentWhere,
    create: built.enrollmentCreate,
    update: { status: 'PENDING' },
  });

  const result = await chargeSnapProductPayment({
    context: built.context,
    enrollmentId: enrollment.id,
  });

  if (!result.ok) return result;

  return {
    ok: true,
    paymentId: result.paymentId,
    redirectPath: STUDENT_ROUTES.pembayaran(result.paymentId),
    snapToken: result.snapToken,
  };
}

/** Reopen or regenerate Snap token for an existing open payment (1:1 enrollment). */
export async function resumeSnapCheckout(
  paymentId: string,
): Promise<PayCheckoutResult> {
  const userId = await requireUserId();

  if (!assertMidtransCheckout() || getCheckoutMode() !== 'snap') {
    return { ok: false, message: 'Checkout Snap tidak aktif.' };
  }

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

  if (!payment || payment.userId !== userId) {
    return { ok: false, message: 'Pembayaran tidak ditemukan.' };
  }
  if (!payment.enrollment || !payment.enrollmentId) {
    return {
      ok: false,
      message: 'Pembayaran ini sudah ditutup. Mulai checkout baru dari halaman produk.',
    };
  }
  if (payment.status !== 'PENDING' && payment.status !== 'CHALLENGE') {
    return { ok: false, message: 'Pembayaran ini tidak bisa dilanjutkan.' };
  }

  const productKey =
    payment.productKey ?? productKeyFromEnrollment(payment.enrollment);
  if (!productKey) return { ok: false, message: 'Produk terkait tidak ditemukan.' };

  const built = await resolveProductCheckout(userId, payment.enrollment.type, productKey);
  if ('error' in built) return { ok: false, message: built.error };

  const result = await chargeSnapProductPayment({
    context: built.context,
    enrollmentId: payment.enrollmentId,
  });

  if (!result.ok) return result;

  return {
    ok: true,
    paymentId: result.paymentId,
    redirectPath: STUDENT_ROUTES.pembayaran(result.paymentId),
    snapToken: result.snapToken,
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

  if (!payment || payment.userId !== userId) {
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

  const enrollmentId = payment.enrollmentId;
  const closed = enrollmentId
    ? await closePendingEnrollmentForTerminalPayment({
        enrollmentId,
        actorUserId: userId,
      })
    : { closed: false, revalidatePaths: [] as string[] };

  await publishPaymentEvent(
    buildPaymentSseEvent({
      paymentId: payment.id,
      orderId: payment.orderId,
      status: 'CANCELED',
      enrollmentId: enrollmentId ?? payment.id,
      enrollmentStatus: payment.enrollment?.status ?? 'PENDING',
      productType: payment.enrollment?.type ?? payment.productType,
      productKey:
        payment.productKey ??
        (payment.enrollment ? productKeyFromEnrollment(payment.enrollment) : null),
    }),
  );

  revalidatePath(STUDENT_ROUTES.pembayaran(paymentId));
  revalidatePath(STUDENT_ROUTES.pembayaranHistory);
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

  if (getCheckoutMode() !== 'core') {
    return { ok: false, message: 'Ganti metode hanya tersedia di mode Core checkout.' };
  }

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

  if (!payment || payment.userId !== userId) {
    return { ok: false, message: 'Pembayaran tidak ditemukan.' };
  }

  if (!payment.enrollment || !payment.enrollmentId) {
    return {
      ok: false,
      message: 'Pembayaran ini sudah ditutup. Mulai checkout baru dari halaman produk.',
    };
  }

  if (payment.status !== 'PENDING' && payment.status !== 'CHALLENGE') {
    return { ok: false, message: 'Metode pembayaran tidak bisa diganti untuk status ini.' };
  }

  const productKey =
    payment.productKey ?? productKeyFromEnrollment(payment.enrollment);
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
  });

  if (!payment || payment.userId !== userId) {
    return { ok: false, message: 'Pembayaran tidak ditemukan.' };
  }

  try {
    const result = await applyProviderPaymentEvent({ externalOrderId: payment.orderId });
    revalidatePath(STUDENT_ROUTES.pembayaran(paymentId));
    revalidatePath(STUDENT_ROUTES.pembayaranHistory);
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
