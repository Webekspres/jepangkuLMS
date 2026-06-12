import { isProviderDestroyedRejection } from '@/lib/vidstack/suppress-provider-destroyed-rejection';

function isAbortError(reason: unknown): boolean {
  if (!(reason instanceof Error)) return false;
  return reason.name === 'AbortError' || reason.name === 'TimeoutError';
}

/** Swallow expected Vidstack teardown rejections; log the rest. */
export function isIgnorableMediaError(reason: unknown): boolean {
  return isProviderDestroyedRejection(reason) || isAbortError(reason);
}

export async function safeMediaOperation(
  operation: () => Promise<unknown> | void,
  options?: { silent?: boolean },
): Promise<void> {
  try {
    await operation();
  } catch (reason) {
    if (isIgnorableMediaError(reason)) return;
    if (!options?.silent) {
      console.error('Media operation failed:', reason);
    }
  }
}

/** Fire-and-forget variant for pause/play that may return a promise. */
export function safeMediaPromise(promise: Promise<unknown> | void): void {
  void safeMediaOperation(() => promise);
}
