import {
  getCatalogMethod,
  METHOD_CATALOG,
} from '@/lib/payment-engine/registry/methods-catalog';
import type { CheckoutMethodId, PaymentMethodMeta } from '@/lib/payment-engine/types';
import { prisma } from '@/lib/prisma';

export {
  getCatalogMethod,
  getCheckoutMethod,
  isChannelNotActivatedError,
  listCheckoutMethodGroups,
  METHOD_CATALOG,
  paymentMethodIconSrc,
  type PaymentMethodGroup,
  type PaymentMethodGroupId,
} from '@/lib/payment-engine/registry/methods-catalog';

export async function listCheckoutMethods(): Promise<PaymentMethodMeta[]> {
  const rows = await prisma.paymentMethodSetting.findMany({
    where: { enabled: true },
    select: { methodId: true },
  });
  const enabled = new Set(rows.map((r) => r.methodId));

  return METHOD_CATALOG.filter((m) => enabled.has(m.id) && !m.maintenance).sort(
    (a, b) => a.priority - b.priority,
  );
}

export async function isCheckoutMethodAvailable(id: CheckoutMethodId): Promise<boolean> {
  const row = await prisma.paymentMethodSetting.findUnique({
    where: { methodId: id },
    select: { enabled: true },
  });
  if (!row?.enabled) return false;
  const meta = getCatalogMethod(id);
  return Boolean(meta && !meta.maintenance);
}

export async function disableCheckoutMethod(
  methodId: CheckoutMethodId,
  reason: string,
): Promise<void> {
  await prisma.paymentMethodSetting.upsert({
    where: { methodId },
    create: {
      methodId,
      enabled: false,
      disabledReason: reason,
    },
    update: {
      enabled: false,
      disabledReason: reason,
    },
  });
}
