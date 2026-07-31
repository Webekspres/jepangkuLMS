import type { EnrollmentType, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export type StudentPaymentHistoryItem = {
  id: string;
  orderId: string;
  status: PaymentStatus;
  amountIdr: number;
  createdAt: string;
  paidAt: string | null;
  productType: EnrollmentType;
  productTitle: string;
  detailHref: string;
};

export async function loadStudentPayments(
  userId: string,
): Promise<StudentPaymentHistoryItem[]> {
  const rows = await prisma.payment.findMany({
    where: { enrollment: { userId } },
    orderBy: { createdAt: 'desc' },
    include: {
      enrollment: {
        include: {
          course: { select: { title: true } },
          liveClass: { select: { title: true } },
          tryoutSession: { select: { title: true } },
        },
      },
    },
  });

  return rows.map((row) => {
    const title =
      row.enrollment.course?.title ??
      row.enrollment.liveClass?.title ??
      row.enrollment.tryoutSession?.title ??
      'Produk';
    return {
      id: row.id,
      orderId: row.orderId,
      status: row.status,
      amountIdr: row.amountIdr,
      createdAt: row.createdAt.toISOString(),
      paidAt: row.paidAt?.toISOString() ?? null,
      productType: row.enrollment.type,
      productTitle: title,
      detailHref: STUDENT_ROUTES.pembayaran(row.id),
    };
  });
}
