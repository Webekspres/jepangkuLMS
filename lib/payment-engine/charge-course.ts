import { Prisma, type EnrollmentType } from '@prisma/client';
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
import { revalidatePath, revalidateTag } from 'next/cache';

export type ChargeCourseResult =
  | { ok: true; paymentId: string; enrollmentId: string }
  | { ok: false; message: string };

async function persistCharge(input: {
  enrollmentId: string;
  orderId: string;
  amountIdr: number;
  methodId: CheckoutMethodId;
  productType: EnrollmentType;
  courseSlug: string | null;
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
      courseSlug: input.courseSlug,
    }),
  );

  return payment;
}

export async function chargeCoursePayment(input: {
  context: CheckoutContext;
  methodId: CheckoutMethodId;
  enrollmentId: string;
}): Promise<ChargeCourseResult> {
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
      courseSlug: context.product.slug,
      charge,
    });

    revalidatePath('/admin/pembayaran');
    revalidatePath('/dashboard/kursus');
    revalidatePath(`/dashboard/kursus/${context.product.slug}`);
    revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(context.buyer.userId), 'default');

    return { ok: true, paymentId: payment.id, enrollmentId: input.enrollmentId };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Gagal membuat pembayaran Midtrans.',
    };
  }
}

export function parsePaymentInstructions(value: unknown): PaymentInstructions | null {
  if (!value || typeof value !== 'object') return null;
  const kind = (value as { kind?: string }).kind;
  if (kind === 'qris' || kind === 'va' || kind === 'ewallet' || kind === 'cstore') {
    return value as PaymentInstructions;
  }
  return null;
}
