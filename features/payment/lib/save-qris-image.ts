const QRIS_FILENAME = 'qris-jepangku.png';

export type SaveQrisImageResult =
  | { ok: true; via: 'share' | 'download' }
  | { ok: false; message: string; aborted?: boolean };

function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Fetch same-origin QRIS proxy, then iOS share sheet or blob download. */
export async function saveQrisImage(paymentId: string): Promise<SaveQrisImageResult> {
  try {
    const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}/qris`, {
      method: 'GET',
      headers: { Accept: 'image/*,application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false,
        message: data?.message ?? 'Gagal mengunduh gambar QR.',
      };
    }

    const blob = await res.blob();
    if (!blob.size) {
      return { ok: false, message: 'Gambar QR kosong.' };
    }

    const mime = blob.type || 'image/png';
    const file = new File([blob], QRIS_FILENAME, { type: mime });

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      typeof navigator.share === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: 'QRIS JepangKu',
        });
        return { ok: true, via: 'share' };
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return { ok: false, message: 'Dibatalkan.', aborted: true };
        }
        // Share failed — fall through to download.
      }
    }

    triggerBlobDownload(blob, QRIS_FILENAME);
    return { ok: true, via: 'download' };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Gagal mengunduh gambar QR.',
    };
  }
}
