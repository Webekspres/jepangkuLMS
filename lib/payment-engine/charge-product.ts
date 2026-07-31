import { Prisma, type EnrollmentType } from '@prisma/client';
import { logEnrollmentRequested } from '@/features/admin-cms/lib/enrollment-log';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
import { buildMidtransOrderId } from '@/lib/midtrans/payment';
import { buildPaymentSseEvent } from '@/lib/payment/sse-event';
import { publishPaymentEvent } from '@/lib/payment/sse-hub';
import {
  assertCheckoutReadyToCharge,
  getPaymentProvider,
  withCheckoutMethod,
} from '@/lib/payment-engine/service';
import type { CheckoutContext, CheckoutMethodId, PaymentInstructions } from '@/lib/payment-engine/types';
import { prisma } from '@/lib/prisma';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { revalidatePath, revalidateTag } from 'next/cache';

export type ChargeProductResult =
  | { ok: true; paymentId: string; enrollmentId: string }
  | { ok: false; message: string };

async function persistCharge(input: {
  enrollmentId: string;
  orderId: string;
  amountIdr: number;
  methodId: CheckoutMethodId;
  productType: EnrollmentType;
  productKey: string | null;
  charge: Awaited<ReturnType<ReturnType<typeof getPaymentProvider>['charge']>>;
}) {
  const payment = await prisma.payment.upsert({
    where: { enrollmentId: input.enrollmentId },
    create: {
      enrollmentId: input.enrollmentId,
      orderId: input.orderId,
      amountIdr: input.amountIdr,
      status: input.charge.status === 'PAID' ? 'PAID' : 'PENDING',
      checkoutMethod: input.methodId,
      instructions: input.charge.instructions as unknown as Prisma.InputJsonValue,
      rawChargeResponse: input.charge.raw as Prisma.InputJsonValue,
      transactionId: input.charge.externalTransactionId,
      paymentType: input.charge.providerPaymentType,
      expiresAt: input.charge.expiresAt,
      snapToken: null,
      paidAt: input.charge.status === 'PAID' ? new Date() : null,
    },
    update: {
      orderId: input.orderId,
      amountIdr: input.amountIdr,
      status: input.charge.status === 'PAID' ? 'PAID' : 'PENDING',
      checkoutMethod: input.methodId,
      instructions: input.charge.instructions as unknown as Prisma.InputJsonValue,
      rawChargeResponse: input.charge.raw as Prisma.InputJsonValue,
      transactionId: input.charge.externalTransactionId,
      paymentType: input.charge.providerPaymentType,
      expiresAt: input.charge.expiresAt,
      snapToken: null,
      statusCode: null,
      transactionStatus: null,
      fraudStatus: null,
      rawNotification: Prisma.JsonNull,
      paidAt: input.charge.status === 'PAID' ? new Date() : null,
    },
  });

  if (input.charge.status === 'PAID') {
    await prisma.enrollment.update({
      where: { id: input.enrollmentId },
      data: { status: 'ACTIVE' },
    });
  }

  await publishPaymentEvent(
    buildPaymentSseEvent({
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      enrollmentId: input.enrollmentId,
      enrollmentStatus: input.charge.status === 'PAID' ? 'ACTIVE' : 'PENDING',
      productType: input.productType,
      productKey: input.productKey,
    }),
  );

  return payment;
}

function revalidateProductPaths(context: CheckoutContext) {
  revalidatePath('/admin/pembayaran');
  revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(context.buyer.userId), 'default');

  switch (context.product.type) {
    case 'COURSE':
      revalidatePath('/dashboard/kursus');
      revalidatePath(STUDENT_ROUTES.kursusDetail(context.product.slug));
      break;
    case 'LIVE_CLASS':
      revalidatePath('/dashboard/live-class');
      revalidatePath(STUDENT_ROUTES.liveClassDetail(context.product.id));
      break;
    case 'TRYOUT':
      revalidatePath('/dashboard/tryout');
      break;
  }
}

export async function chargeProductPayment(input: {
  context: CheckoutContext;
  methodId: CheckoutMethodId;
  enrollmentId: string;
}): Promise<ChargeProductResult> {
  try {
    const context = withCheckoutMethod(input.context, input.methodId);
    assertCheckoutReadyToCharge(context, input.methodId);

    const existing = await prisma.payment.findUnique({
      where: { enrollmentId: input.enrollmentId },
    });

    if (existing?.status === 'PENDING' && existing.orderId) {
      try {
        await getPaymentProvider('midtrans').cancel?.(existing.orderId);
      } catch {
        // Best-effort cancel of previous Midtrans order
      }
    }

    const orderId = buildMidtransOrderId(input.enrollmentId);
    const provider = getPaymentProvider(context.providerId);
    const charge = await provider.charge({
      externalOrderId: orderId,
      amountIdr: context.pricing.totalIdr,
      methodId: input.methodId,
      item: {
        id: context.product.id,
        name: context.product.title,
        quantity: 1,
        priceIdr: context.pricing.totalIdr,
      },
      customer: {
        firstName: context.buyer.name ?? undefined,
        email: context.buyer.email ?? undefined,
        phone: context.buyer.phone ?? undefined,
      },
    });

    const payment = await persistCharge({
      enrollmentId: input.enrollmentId,
      orderId: charge.externalOrderId,
      amountIdr: context.pricing.totalIdr,
      methodId: input.methodId,
      productType: context.product.type,
      productKey: context.product.slug,
      charge,
    });

    try {
      await logEnrollmentRequested({
        enrollmentId: input.enrollmentId,
        userId: context.buyer.userId,
        type: context.product.type,
        productTitle: context.product.title,
        productSubtitle: context.product.slug,
        studentName: context.buyer.name?.trim() || 'Siswa',
      });
    } catch {
      // Non-fatal — payment already persisted
    }

    revalidateProductPaths(context);

    return { ok: true, paymentId: payment.id, enrollmentId: input.enrollmentId };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Gagal membuat pembayaran Midtrans.',
    };
  }
}

/** @deprecated Prefer chargeProductPayment */
export async function chargeCoursePayment(input: {
  context: CheckoutContext;
  methodId: CheckoutMethodId;
  enrollmentId: string;
}): Promise<ChargeProductResult> {
  return chargeProductPayment(input);
}

export function parsePaymentInstructions(value: unknown): PaymentInstructions | null {
  if (!value || typeof value !== 'object') return null;
  const kind = (value as { kind?: string }).kind;
  if (kind === 'qris' || kind === 'va' || kind === 'ewallet' || kind === 'cstore') {
    return value as PaymentInstructions;
  }
  return null;
}
