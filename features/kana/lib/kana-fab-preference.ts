/** localStorage key + sync event for the student-area kana floating launcher. */

export const KANA_FAB_DISMISS_KEY = 'jepangku-kana-fab-dismissed';
export const KANA_FAB_CHANGE_EVENT = 'jepangku:kana-fab-preference';

export function isKanaFabDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(KANA_FAB_DISMISS_KEY) === '1';
}

export function setKanaFabDismissed(dismissed: boolean) {
  if (typeof window === 'undefined') return;
  if (dismissed) {
    window.localStorage.setItem(KANA_FAB_DISMISS_KEY, '1');
  } else {
    window.localStorage.removeItem(KANA_FAB_DISMISS_KEY);
  }
  window.dispatchEvent(
    new CustomEvent(KANA_FAB_CHANGE_EVENT, { detail: { dismissed } }),
  );
}
