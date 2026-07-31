import type { CheckoutProductType } from '@/lib/payment-engine/types';

/** Pure path helper — safe for Client Components (no Prisma / Node APIs). */
export function checkoutPathFor(productType: CheckoutProductType, productKey: string): string {
  switch (productType) {
    case 'COURSE':
      return `/dashboard/checkout/kursus/${encodeURIComponent(productKey)}`;
    case 'LIVE_CLASS':
      return `/dashboard/checkout/live-class/${encodeURIComponent(productKey)}`;
    case 'TRYOUT':
      return `/dashboard/checkout/tryout/${encodeURIComponent(productKey)}`;
    default: {
      const _exhaustive: never = productType;
      return `/dashboard/checkout/kursus/${_exhaustive}`;
    }
  }
}
