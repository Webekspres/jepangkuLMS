/**
 * Client-only Snap UX helpers.
 * Callbacks MUST NOT settle Payment / activate Enrollment — webhook is SoT.
 */

export type SnapPayUxCallbacks = {
  onNavigateToPaymentDetail: (paymentId: string) => void;
  onToast?: (kind: 'success' | 'info' | 'error', message: string) => void;
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
 * Open Midtrans Snap popup. UX only — navigate to Payment Detail; never settle.
 * onClose does NOT cancel the Payment.
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

  const goDetail = () => input.callbacks.onNavigateToPaymentDetail(input.paymentId);

  window.snap.pay(input.snapToken, {
    onSuccess: () => {
      input.callbacks.onToast?.(
        'info',
        'Pembayaran diterima Midtrans. Status akan dikonfirmasi otomatis di halaman pembayaran.',
      );
      goDetail();
    },
    onPending: () => {
      input.callbacks.onToast?.(
        'info',
        'Selesaikan pembayaran sesuai metode yang dipilih. Status diperbarui otomatis.',
      );
      goDetail();
    },
    onError: () => {
      input.callbacks.onToast?.(
        'error',
        'Midtrans mengembalikan error. Cek status di halaman pembayaran atau coba lagi.',
      );
      goDetail();
    },
    onClose: () => {
      // Closing Snap does NOT cancel Payment — user can reopen from Payment Detail.
      goDetail();
    },
  });
}
