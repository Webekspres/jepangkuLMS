import { notFound } from 'next/navigation';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { getCoreSession } from '@/lib/core';
import { ADMIN_CONTACT } from '@/lib/admin-contact';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { paymentMethodDisplayLabel } from '@/features/payment/lib/payment-product-cover';
import type { CheckoutProductType } from '@/lib/payment-engine/types';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { prisma } from '@/lib/prisma';

export type PaymentInvoiceView = {
  paymentId: string;
  orderId: string;
  amountIdr: number;
  methodLabel: string;
  createdAt: string;
  paidAt: string;
  product: {
    type: CheckoutProductType;
    title: string;
  };
  billFrom: {
    name: string;
    website: string;
    email: string;
    phoneDisplay: string;
  };
  billTo: {
    name: string;
    email: string | null;
  };
  detailHref: string;
};

export async function loadPaymentInvoice(paymentId: string): Promise<PaymentInvoiceView> {
  const userId = await requireAuthUserWithAnchor();

  const [payment, session, user] = await Promise.all([
    prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        enrollment: {
          include: {
            course: { select: { title: true } },
            liveClass: { select: { title: true } },
            tryoutSession: { select: { title: true } },
          },
        },
      },
    }),
    getCoreSession(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, ssoDisplayName: true, ssoEmail: true },
    }),
  ]);

  if (!payment || payment.userId !== userId || payment.status !== 'PAID') {
    notFound();
  }

  const productTitle =
    payment.enrollment?.course?.title ??
    payment.enrollment?.liveClass?.title ??
    payment.enrollment?.tryoutSession?.title ??
    payment.productTitle;

  const productType = (payment.enrollment?.type ?? payment.productType) as CheckoutProductType;

  const buyerName =
    session?.profile.displayName?.trim() ||
    resolvePublicDisplayName({
      displayName: user?.displayName,
      ssoDisplayName: user?.ssoDisplayName,
    });

  const buyerEmail =
    session?.claims.email?.trim() || user?.ssoEmail?.trim() || null;

  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    amountIdr: payment.amountIdr,
    methodLabel: payment.snapToken
      ? 'Midtrans Snap'
      : paymentMethodDisplayLabel(payment.checkoutMethod),
    createdAt: payment.createdAt.toISOString(),
    paidAt: (payment.paidAt ?? payment.createdAt).toISOString(),
    product: {
      type: productType,
      title: productTitle,
    },
    billFrom: {
      name: 'JepangKu LMS',
      website: 'kursus.jepangku.com',
      email: ADMIN_CONTACT.email,
      phoneDisplay: ADMIN_CONTACT.waDisplay,
    },
    billTo: {
      name: buyerName,
      email: buyerEmail,
    },
    detailHref: STUDENT_ROUTES.pembayaran(payment.id),
  };
}
