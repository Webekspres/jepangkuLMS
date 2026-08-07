import type { EnrollmentType } from '@prisma/client';
import {
  DEFAULT_THUMB,
  resolveLiveClassCoverUrl,
} from '@/features/learning/lib/course-display';
import { DEFAULT_TRYOUT_COVER } from '@/features/learning/lib/load-marketing-catalog-extras';
import { resolveMediaUrl } from '@/lib/media/image-src';
import { getCheckoutMethod } from '@/lib/payment-engine/registry/methods-catalog';
import type { CheckoutMethodId } from '@/lib/payment-engine/types';

export function resolvePaymentProductCover(input: {
  type: EnrollmentType;
  courseCoverUrl?: string | null;
  liveClassCoverUrl?: string | null;
}): string {
  if (input.type === 'LIVE_CLASS') {
    return resolveLiveClassCoverUrl(input.liveClassCoverUrl);
  }
  if (input.type === 'COURSE') {
    const cover =
      resolveMediaUrl(input.courseCoverUrl) ?? input.courseCoverUrl?.trim() ?? '';
    return cover || DEFAULT_THUMB;
  }
  return DEFAULT_TRYOUT_COVER;
}

export function paymentMethodDisplayLabel(checkoutMethod: string | null): string {
  if (!checkoutMethod) return 'Midtrans';
  const meta = getCheckoutMethod(checkoutMethod as CheckoutMethodId);
  return meta ? `Midtrans · ${meta.displayName}` : `Midtrans · ${checkoutMethod}`;
}
