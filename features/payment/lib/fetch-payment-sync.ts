import type { PaymentStatus } from '@prisma/client';

export type PaymentSyncResult =
  | { ok: true; status: PaymentStatus; paymentId: string }
  | { ok: false; message: string };

/** Client helper — POST /api/payments/[id]/sync (JSON, not Server Action). */
export async function fetchPaymentSync(
  paymentId: string,
  init?: { signal?: AbortSignal },
): Promise<PaymentSyncResult> {
  try {
    const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}/sync`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      signal: init?.signal,
    });
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; status?: string; paymentId?: string; message?: string }
      | null;
    if (!res.ok || !data?.ok || !data.status) {
      return {
        ok: false,
        message: data?.message ?? 'Gagal menyinkronkan status.',
      };
    }
    return {
      ok: true,
      status: data.status as PaymentStatus,
      paymentId: data.paymentId ?? paymentId,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, message: 'Dibatalkan.' };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Gagal menyinkronkan status.',
    };
  }
}
