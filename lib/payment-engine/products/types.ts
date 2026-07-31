import type { CheckoutContext, CheckoutProductType } from '@/lib/payment-engine/types';

export type ProductCheckoutResolveOk = {
  context: CheckoutContext;
  /** Stable key used in routes (slug / id / session code). */
  productKey: string;
  priceIdr: number;
  backHref: string;
  successHref: string;
  /** Enrollment unique lookup helpers */
  enrollmentWhere:
    | { userId_courseId: { userId: string; courseId: string } }
    | { userId_liveClassId: { userId: string; liveClassId: string } }
    | { userId_tryoutSessionId: { userId: string; tryoutSessionId: string } };
  enrollmentCreate: {
    userId: string;
    type: CheckoutProductType;
    courseId?: string;
    liveClassId?: string;
    tryoutSessionId?: string;
    status: 'PENDING';
  };
};

export type ProductCheckoutResolveResult =
  | ProductCheckoutResolveOk
  | { error: string };
