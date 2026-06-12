/**
 * Vidstack YouTube/Vimeo providers reject pending promises with the string
 * "provider destroyed" on teardown. That is expected but surfaces as a Next.js
 * runtime overlay unless we swallow it globally.
 *
 * @see https://github.com/vidstack/player/issues/1592
 */
const PROVIDER_DESTROYED = 'provider destroyed';

export function isProviderDestroyedRejection(reason: unknown): boolean {
  if (reason === PROVIDER_DESTROYED) return true;
  if (typeof reason === 'string' && reason.includes(PROVIDER_DESTROYED)) return true;
  if (reason instanceof Error && reason.message.includes(PROVIDER_DESTROYED)) return true;
  return false;
}

function onUnhandledRejection(event: PromiseRejectionEvent) {
  if (!isProviderDestroyedRejection(event.reason)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

let registered = false;

/** Register once on the client; safe to call multiple times. */
export function registerProviderDestroyedRejectionGuard() {
  if (typeof window === 'undefined' || registered) return;
  registered = true;
  window.addEventListener('unhandledrejection', onUnhandledRejection, { capture: true });
}

registerProviderDestroyedRejectionGuard();
