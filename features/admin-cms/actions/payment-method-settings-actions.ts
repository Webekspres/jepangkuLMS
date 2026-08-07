'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { METHOD_CATALOG } from '@/lib/payment-engine/registry/methods';
import type { CheckoutMethodId } from '@/lib/payment-engine/types';
import { prisma } from '@/lib/prisma';

const CATALOG_IDS = new Set(METHOD_CATALOG.map((m) => m.id));

export type SetPaymentMethodEnabledResult =
  | { ok: true }
  | { ok: false; message: string };

export async function setPaymentMethodEnabled(input: {
  methodId: string;
  enabled: boolean;
}): Promise<SetPaymentMethodEnabledResult> {
  await requireAdminAction();

  if (!CATALOG_IDS.has(input.methodId as CheckoutMethodId)) {
    return { ok: false, message: 'Metode pembayaran tidak dikenal.' };
  }

  await prisma.paymentMethodSetting.upsert({
    where: { methodId: input.methodId },
    create: {
      methodId: input.methodId,
      enabled: input.enabled,
      disabledReason: input.enabled ? null : 'Dinonaktifkan oleh admin',
    },
    update: {
      enabled: input.enabled,
      disabledReason: input.enabled ? null : 'Dinonaktifkan oleh admin',
    },
  });

  revalidatePath('/admin/pembayaran');
  revalidatePath('/dashboard/checkout', 'layout');
  return { ok: true };
}
