import { resolveCourseCheckout } from '@/lib/payment-engine/products/course';
import { resolveLiveClassCheckout } from '@/lib/payment-engine/products/live-class';
import { resolveTryoutCheckout } from '@/lib/payment-engine/products/tryout';
import type { ProductCheckoutResolveResult } from '@/lib/payment-engine/products/types';
import type { CheckoutProductType } from '@/lib/payment-engine/types';

export type { ProductCheckoutResolveOk, ProductCheckoutResolveResult } from '@/lib/payment-engine/products/types';
export { resolveCourseCheckout } from '@/lib/payment-engine/products/course';
export { resolveLiveClassCheckout } from '@/lib/payment-engine/products/live-class';
export { resolveTryoutCheckout } from '@/lib/payment-engine/products/tryout';
export { checkoutPathFor } from '@/lib/payment-engine/products/paths';

export async function resolveProductCheckout(
  userId: string,
  productType: CheckoutProductType,
  productKey: string,
): Promise<ProductCheckoutResolveResult> {
  switch (productType) {
    case 'COURSE':
      return resolveCourseCheckout(userId, productKey);
    case 'LIVE_CLASS':
      return resolveLiveClassCheckout(userId, productKey);
    case 'TRYOUT':
      return resolveTryoutCheckout(userId, productKey);
    default: {
      const _exhaustive: never = productType;
      return { error: `Tipe produk tidak didukung: ${_exhaustive}` };
    }
  }
}
