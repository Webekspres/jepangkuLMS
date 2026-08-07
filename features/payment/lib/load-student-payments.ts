import type { EnrollmentType, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { resolvePaymentProductCover } from '@/features/payment/lib/payment-product-cover';
import { getCheckoutMode } from '@/lib/midtrans/config';
import { isOpenMidtransPaymentStatus } from '@/lib/payment/payment-status';

export type StudentPaymentHistoryItem = {
  id: string;
  orderId: string;
  status: PaymentStatus;
  amountIdr: number;
  createdAt: string;
  paidAt: string | null;
  productType: EnrollmentType;
  productTitle: string;
  coverSrc: string;
  detailHref: string;
  /** Pending Snap — CTA "Lanjutkan" instead of "Detail". */
  resumePending: boolean;
};

export async function loadStudentPayments(
  userId: string,
): Promise<StudentPaymentHistoryItem[]> {
  const snapMode = getCheckoutMode() === 'snap';
  const rows = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      enrollment: {
        include: {
          course: { select: { title: true, coverImageUrl: true } },
          liveClass: { select: { title: true, coverImageUrl: true } },
          tryoutSession: { select: { title: true } },
        },
      },
    },
  });

  return rows.map((row) => {
    const title =
      row.enrollment?.course?.title ??
      row.enrollment?.liveClass?.title ??
      row.enrollment?.tryoutSession?.title ??
      row.productTitle;
    const productType = row.enrollment?.type ?? row.productType;
    const resumePending = snapMode && isOpenMidtransPaymentStatus(row.status);
    return {
      id: row.id,
      orderId: row.orderId,
      status: row.status,
      amountIdr: row.amountIdr,
      createdAt: row.createdAt.toISOString(),
      paidAt: row.paidAt?.toISOString() ?? null,
      productType,
      productTitle: title,
      coverSrc: resolvePaymentProductCover({
        type: productType,
        courseCoverUrl: row.enrollment?.course?.coverImageUrl,
        liveClassCoverUrl: row.enrollment?.liveClass?.coverImageUrl,
      }),
      detailHref: STUDENT_ROUTES.pembayaran(row.id, { resume: resumePending }),
      resumePending,
    };
  });
}
