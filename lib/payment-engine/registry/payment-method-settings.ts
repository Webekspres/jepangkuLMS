import { METHOD_CATALOG } from '@/lib/payment-engine/registry/methods-catalog';
import type { CheckoutMethodId } from '@/lib/payment-engine/types';
import { prisma } from '@/lib/prisma';

export type AdminPaymentMethodRow = {
  methodId: CheckoutMethodId;
  displayName: string;
  description?: string;
  category: string;
  enabled: boolean;
  disabledReason: string | null;
  updatedAt: Date | null;
};

/** Ensure every catalog method has a settings row (idempotent). */
export async function ensurePaymentMethodSettings(): Promise<void> {
  await prisma.$transaction(
    METHOD_CATALOG.map((m) =>
      prisma.paymentMethodSetting.upsert({
        where: { methodId: m.id },
        create: { methodId: m.id, enabled: false },
        update: {},
      }),
    ),
  );
}

export async function loadAdminPaymentMethodSettings(): Promise<AdminPaymentMethodRow[]> {
  await ensurePaymentMethodSettings();
  const rows = await prisma.paymentMethodSetting.findMany();
  const byId = new Map(rows.map((r) => [r.methodId, r]));

  return METHOD_CATALOG.map((meta) => {
    const row = byId.get(meta.id);
    return {
      methodId: meta.id,
      displayName: meta.displayName,
      description: meta.description,
      category: meta.category,
      enabled: row?.enabled ?? false,
      disabledReason: row?.disabledReason ?? null,
      updatedAt: row?.updatedAt ?? null,
    };
  });
}
