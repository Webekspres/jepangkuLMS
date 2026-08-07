/**
 * Client-only Snap UX helpers.
 * Callbacks MUST NOT settle Payment / activate Enrollment — webhook/Status API is SoT.
 * `onReconcile` may call Status API sync (same as "Cek status") after Snap UX ends.
 */

export type SnapPayUxCallbacks = {
  onNavigateToPaymentDetail: (paymentId: string) => void;
  onToast?: (kind: 'success' | 'info' | 'error', message: string) => void;
  /**
   * After Snap success/pending/close — reconcile via Midtrans Status API + refresh UI.
   * Does not mark PAID from Snap JS alone; server fetchStatus is authoritative.
   */
  onReconcile?: (paymentId: string) => void | Promise<void>;
};

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

const SNAP_READY_TIMEOUT_MS = 10_000;
const SNAP_POLL_MS = 50;

export function waitForWindowSnap(timeoutMs = SNAP_READY_TIMEOUT_MS): Promise<boolean> {
  if (typeof window !== 'undefined' && window.snap) return Promise.resolve(true);

  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (window.snap) {
        resolve(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(false);
        return;
      }
      window.setTimeout(tick, SNAP_POLL_MS);
    };
    tick();
  });
}

/**
 * Open Midtrans Snap popup. UX only — never settle from Snap JS.
 * onClose does NOT cancel Payment; it still reconciles in case payment already settled.
 */
export async function openSnapPayUx(input: {
  snapToken: string;
  paymentId: string;
  callbacks: SnapPayUxCallbacks;
}): Promise<void> {
  const ready = window.snap ? true : await waitForWindowSnap();
  if (!ready || !window.snap) {
    input.callbacks.onToast?.(
      'error',
      'Snap Midtrans belum siap. Muat ulang halaman, lalu coba lagi.',
    );
    input.callbacks.onNavigateToPaymentDetail(input.paymentId);
    return;
  }

  const finish = async (kind: 'success' | 'pending' | 'error' | 'close') => {
    try {
      await input.callbacks.onReconcile?.(input.paymentId);
    } catch {
      // non-fatal — detail page / Cek status remains fallback
    }
    if (kind === 'success') {
      input.callbacks.onToast?.(
        'info',
        'Pembayaran diterima Midtrans. Mengonfirmasi status…',
      );
    } else if (kind === 'pending') {
      input.callbacks.onToast?.(
        'info',
        'Selesaikan pembayaran sesuai metode yang dipilih. Status diperbarui otomatis.',
      );
    } else if (kind === 'error') {
      input.callbacks.onToast?.(
        'error',
        'Midtrans mengembalikan error. Cek status di halaman pembayaran atau coba lagi.',
      );
    }
    input.callbacks.onNavigateToPaymentDetail(input.paymentId);
  };

  window.snap.pay(input.snapToken, {
    onSuccess: () => {
      void finish('success');
    },
    onPending: () => {
      void finish('pending');
    },
    onError: () => {
      void finish('error');
    },
    onClose: () => {
      // Closing Snap does NOT cancel Payment — reconcile in case already paid.
      void finish('close');
    },
  });
}
