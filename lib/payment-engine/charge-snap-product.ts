import { Prisma, type EnrollmentType } from '@prisma/client';
import { logEnrollmentRequested } from '@/features/admin-cms/lib/enrollment-log';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
import { getMidtransSnapClient, getMidtransCoreApi } from '@/lib/midtrans/client';
import { buildMidtransOrderId } from '@/lib/midtrans/payment';
import { buildPaymentSseEvent } from '@/lib/payment/sse-event';
import { publishPaymentEvent } from '@/lib/payment/sse-hub';
import type { CheckoutContext } from '@/lib/payment-engine/types';
import { prisma } from '@/lib/prisma';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { revalidatePath, revalidateTag } from 'next/cache';

const SNAP_DEFAULT_EXPIRY_MINUTES = 60;

export type ChargeSnapResult =
  | { ok: true; paymentId: string; enrollmentId: string; snapToken: string }
  | { ok: false; message: string };

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

/** Local checks before Midtrans Status API — exported for unit tests. */
export function canReuseSnapTokenLocally(payment: {
  status: string;
  snapToken: string | null;
  expiresAt: Date | null;
}): boolean {
  if (payment.status !== 'PENDING' && payment.status !== 'CHALLENGE') return false;
  if (!payment.snapToken?.trim()) return false;
  if (payment.expiresAt && payment.expiresAt.getTime() <= Date.now()) return false;
  return true;
}

/** True when existing Snap payment can be reopened without regenerating. */
export async function isReusableSnapPayment(payment: {
  status: string;
  snapToken: string | null;
  orderId: string;
  expiresAt: Date | null;
}): Promise<boolean> {
  if (!canReuseSnapTokenLocally(payment)) return false;

  try {
    const core = getMidtransCoreApi();
    const raw = (await core.transaction.status(payment.orderId)) as {
      transaction_status?: string;
    };
    const status = raw.transaction_status ?? '';
    if (status === 'expire' || status === 'cancel' || status === 'deny' || status === 'failure') {
      return false;
    }
    return true;
  } catch {
    // Status unknown — treat as unusable and regenerate
    return false;
  }
}

async function persistSnapPayment(input: {
  enrollmentId: string;
  userId: string;
  orderId: string;
  amountIdr: number;
  productType: EnrollmentType;
  productTitle: string;
  productKey: string | null;
  snapToken: string;
  expiresAt: Date;
  raw: Record<string, unknown>;
}) {
  const payment = await prisma.payment.upsert({
    where: { enrollmentId: input.enrollmentId },
    create: {
      enrollmentId: input.enrollmentId,
      userId: input.userId,
      productType: input.productType,
      productTitle: input.productTitle,
      productKey: input.productKey,
      orderId: input.orderId,
      amountIdr: input.amountIdr,
      status: 'PENDING',
      snapToken: input.snapToken,
      checkoutMethod: null,
      instructions: Prisma.JsonNull,
      rawChargeResponse: input.raw as Prisma.InputJsonValue,
      expiresAt: input.expiresAt,
      paidAt: null,
    },
    update: {
      orderId: input.orderId,
      userId: input.userId,
      productType: input.productType,
      productTitle: input.productTitle,
      productKey: input.productKey,
      amountIdr: input.amountIdr,
      status: 'PENDING',
      snapToken: input.snapToken,
      checkoutMethod: null,
      instructions: Prisma.JsonNull,
      rawChargeResponse: input.raw as Prisma.InputJsonValue,
      transactionId: null,
      paymentType: null,
      expiresAt: input.expiresAt,
      statusCode: null,
      transactionStatus: null,
      fraudStatus: null,
      rawNotification: Prisma.JsonNull,
      paidAt: null,
    },
  });

  await publishPaymentEvent(
    buildPaymentSseEvent({
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      enrollmentId: input.enrollmentId,
      enrollmentStatus: 'PENDING',
      productType: input.productType,
      productKey: input.productKey,
    }),
  );

  return payment;
}

/**
 * Create or reuse Snap transaction for a product enrollment (1:1 Payment).
 * Does NOT settle Payment/Enrollment — webhook remains SoT.
 */
export async function chargeSnapProductPayment(input: {
  context: CheckoutContext;
  enrollmentId: string;
}): Promise<ChargeSnapResult> {
  try {
    if (input.context.pricing.totalIdr <= 0) {
      return { ok: false, message: 'Checkout total must be greater than zero for paid charge' };
    }

    const existing = await prisma.payment.findUnique({
      where: { enrollmentId: input.enrollmentId },
    });

    if (existing) {
      const reusable = await isReusableSnapPayment(existing);
      if (reusable && existing.snapToken) {
        return {
          ok: true,
          paymentId: existing.id,
          enrollmentId: input.enrollmentId,
          snapToken: existing.snapToken,
        };
      }

      if (existing.status === 'PENDING' || existing.status === 'CHALLENGE') {
        try {
          await getMidtransCoreApi().transaction.cancel(existing.orderId);
        } catch {
          // Best-effort cancel of previous Midtrans order
        }
      }
    }

    const orderId = buildMidtransOrderId(input.enrollmentId);
    const expiresAt = new Date(Date.now() + SNAP_DEFAULT_EXPIRY_MINUTES * 60_000);
    const snap = getMidtransSnapClient();
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: input.context.pricing.totalIdr,
      },
      item_details: [
        {
          id: input.context.product.id,
          price: input.context.pricing.totalIdr,
          quantity: 1,
          name: input.context.product.title.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: input.context.buyer.name ?? 'Siswa JepangKu',
        email: input.context.buyer.email ?? undefined,
        phone: input.context.buyer.phone ?? undefined,
      },
      expiry: {
        unit: 'minutes',
        duration: SNAP_DEFAULT_EXPIRY_MINUTES,
      },
    });

    const payment = await persistSnapPayment({
      enrollmentId: input.enrollmentId,
      userId: input.context.buyer.userId,
      orderId,
      amountIdr: input.context.pricing.totalIdr,
      productType: input.context.product.type,
      productTitle: input.context.product.title,
      productKey: input.context.product.slug,
      snapToken: transaction.token,
      expiresAt,
      raw: transaction as unknown as Record<string, unknown>,
    });

    try {
      await logEnrollmentRequested({
        enrollmentId: input.enrollmentId,
        userId: input.context.buyer.userId,
        type: input.context.product.type,
        productTitle: input.context.product.title,
        productSubtitle: input.context.product.slug,
        studentName: input.context.buyer.name?.trim() || 'Siswa',
      });
    } catch {
      // Non-fatal
    }

    revalidateProductPaths(input.context);

    return {
      ok: true,
      paymentId: payment.id,
      enrollmentId: input.enrollmentId,
      snapToken: transaction.token,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Gagal membuat transaksi Snap Midtrans.',
    };
  }
}
