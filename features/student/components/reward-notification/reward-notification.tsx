'use client';

import { AnimatePresence } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { RewardBottomSheet } from './reward-bottom-sheet';
import { RewardDialog } from './reward-dialog';
import { useRewardNotification } from './reward-notification-context';
import { RewardToast } from './reward-toast';

export function RewardNotification() {
  const isMobile = useIsMobile();
  const { toasts, modalReward, dismissToast, dismissModal } = useRewardNotification();

  const showMediumOnMobile = modalReward?.tier === 'medium' && isMobile;
  const showModalDialog = modalReward && (!isMobile || modalReward.tier === 'large');

  return (
    <>
      <AnimatePresence>
        {toasts.length > 0 && (
          <div className="pointer-events-none fixed top-20 left-1/2 z-100 flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-3 px-4">
            {toasts.map((toast) => (
              <RewardToast key={toast.id} reward={toast} onClose={() => dismissToast(toast.id)} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {showModalDialog ? (
        <RewardDialog reward={modalReward} open onContinue={dismissModal} />
      ) : null}

      {showMediumOnMobile ? (
        <RewardBottomSheet reward={modalReward} open onContinue={dismissModal} />
      ) : null}
    </>
  );
}
