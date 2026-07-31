import type { EnrollmentStatus, EnrollmentType, PaymentStatus } from '@prisma/client';
import type { PaymentSseEvent } from '@/lib/payment/sse-types';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export function buildPaymentSseEvent(input: {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  enrollmentId: string;
  enrollmentStatus: EnrollmentStatus;
  productType: EnrollmentType;
  courseSlug?: string | null;
}): PaymentSseEvent {
  let redirectPath: string | null = null;
  if (input.status === 'PAID' && input.enrollmentStatus === 'ACTIVE') {
    if (input.productType === 'COURSE' && input.courseSlug) {
      redirectPath = STUDENT_ROUTES.kursusDetail(input.courseSlug);
    } else if (input.productType === 'LIVE_CLASS') {
      redirectPath = STUDENT_ROUTES.liveClass;
    } else if (input.productType === 'TRYOUT') {
      redirectPath = STUDENT_ROUTES.tryout;
    }
  }

  return {
    paymentId: input.paymentId,
    orderId: input.orderId,
    status: input.status,
    enrollmentStatus: input.enrollmentStatus,
    enrollmentId: input.enrollmentId,
    productType: input.productType,
    redirectPath,
  };
}
