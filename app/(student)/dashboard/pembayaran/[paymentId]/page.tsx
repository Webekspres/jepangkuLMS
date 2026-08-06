import { notFound } from 'next/navigation';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { listCheckoutMethods } from '@/lib/payment-engine/registry/methods';
import { parsePaymentInstructions } from '@/lib/payment-engine/charge-product';
import type { CheckoutProductType } from '@/lib/payment-engine/types';
import {
  paymentMethodDisplayLabel,
  resolvePaymentProductCover,
} from '@/features/payment/lib/payment-product-cover';
import { PaymentDetailPage } from '@/features/payment/components/payment-detail-page';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { prisma } from '@/lib/prisma';

type Props = { params: Promise<{ paymentId: string }> };

function productViewFromEnrollment(enrollment: {
  type: CheckoutProductType;
  course: { slug: string; title: string; coverImageUrl: string | null } | null;
  liveClass: { id: string; title: string; coverImageUrl: string | null } | null;
  tryoutSession: { code: string; title: string } | null;
}) {
  if (enrollment.type === 'COURSE' && enrollment.course) {
    return {
      type: 'COURSE' as const,
      key: enrollment.course.slug,
      title: enrollment.course.title,
      backHref: STUDENT_ROUTES.kursusDetail(enrollment.course.slug),
      successHref: STUDENT_ROUTES.kursusDetail(enrollment.course.slug),
      successLabel: 'Mulai belajar',
    };
  }
  if (enrollment.type === 'LIVE_CLASS' && enrollment.liveClass) {
    return {
      type: 'LIVE_CLASS' as const,
      key: enrollment.liveClass.id,
      title: enrollment.liveClass.title,
      backHref: STUDENT_ROUTES.liveClassDetail(enrollment.liveClass.id),
      successHref: STUDENT_ROUTES.liveClassDetail(enrollment.liveClass.id),
      successLabel: 'Buka Live Class',
    };
  }
  if (enrollment.type === 'TRYOUT' && enrollment.tryoutSession) {
    return {
      type: 'TRYOUT' as const,
      key: enrollment.tryoutSession.code,
      title: enrollment.tryoutSession.title,
      backHref: STUDENT_ROUTES.tryout,
      successHref: STUDENT_ROUTES.tryoutExam(enrollment.tryoutSession.code),
      successLabel: 'Masuk ujian',
    };
  }
  return null;
}

function productViewFromSnapshot(input: {
  productType: CheckoutProductType;
  productTitle: string;
  productKey: string | null;
}) {
  if (input.productType === 'COURSE') {
    const key = input.productKey ?? '';
    return {
      type: 'COURSE' as const,
      key,
      title: input.productTitle,
      backHref: key ? STUDENT_ROUTES.kursusDetail(key) : STUDENT_ROUTES.kursus,
      successHref: key ? STUDENT_ROUTES.kursusDetail(key) : STUDENT_ROUTES.kursus,
      successLabel: 'Lihat kursus',
    };
  }
  if (input.productType === 'LIVE_CLASS') {
    const key = input.productKey ?? '';
    return {
      type: 'LIVE_CLASS' as const,
      key,
      title: input.productTitle,
      backHref: key ? STUDENT_ROUTES.liveClassDetail(key) : STUDENT_ROUTES.liveClass,
      successHref: key ? STUDENT_ROUTES.liveClassDetail(key) : STUDENT_ROUTES.liveClass,
      successLabel: 'Lihat Live Class',
    };
  }
  const key = input.productKey ?? '';
  return {
    type: 'TRYOUT' as const,
    key,
    title: input.productTitle,
    backHref: STUDENT_ROUTES.tryout,
    successHref: key ? STUDENT_ROUTES.tryoutExam(key) : STUDENT_ROUTES.tryout,
    successLabel: 'Lihat tryout',
  };
}

export default async function PembayaranDetailRoute({ params }: Props) {
  const { paymentId } = await params;
  const userId = await requireAuthUserWithAnchor();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      enrollment: {
        include: {
          course: { select: { slug: true, title: true, coverImageUrl: true } },
          liveClass: { select: { id: true, title: true, coverImageUrl: true } },
          tryoutSession: { select: { code: true, title: true } },
        },
      },
    },
  });

  if (!payment || payment.userId !== userId) notFound();

  const product = payment.enrollment
    ? productViewFromEnrollment(payment.enrollment)
    : productViewFromSnapshot({
        productType: payment.productType,
        productTitle: payment.productTitle,
        productKey: payment.productKey,
      });
  if (!product) notFound();

  const coverSrc = resolvePaymentProductCover({
    type: payment.enrollment?.type ?? payment.productType,
    courseCoverUrl: payment.enrollment?.course?.coverImageUrl,
    liveClassCoverUrl: payment.enrollment?.liveClass?.coverImageUrl,
  });

  return (
    <PaymentDetailPage
      initial={{
        paymentId: payment.id,
        orderId: payment.orderId,
        status: payment.status,
        amountIdr: payment.amountIdr,
        checkoutMethod: payment.checkoutMethod,
        methodLabel: paymentMethodDisplayLabel(payment.checkoutMethod),
        instructions: parsePaymentInstructions(payment.instructions),
        expiresAt: payment.expiresAt?.toISOString() ?? null,
        createdAt: payment.createdAt.toISOString(),
        paidAt: payment.paidAt?.toISOString() ?? null,
        coverSrc,
        historyHref: STUDENT_ROUTES.pembayaranHistory,
        product,
        methods: listCheckoutMethods(),
      }}
    />
  );
}
