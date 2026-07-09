import type { ShowRewardInput } from './types';

export function showReward(input: ShowRewardInput) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('reward-notification', {
      detail: input,
    }),
  );
}
