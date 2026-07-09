'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { GamifiedEvent, GamifiedEventType } from '@/features/student/types/gamified-event';
import { getRewardTier } from './reward-config';
import type {
  ActiveReward,
  ShowRewardInput,
} from './types';

const SMALL_REWARD_AUTO_DISMISS_MS = 5000;

type RewardNotificationContextValue = {
  toasts: ActiveReward[];
  modalReward: ActiveReward | null;
  showReward: (input: ShowRewardInput) => void;
  dismissToast: (id: string) => void;
  dismissModal: () => void;
};

const RewardNotificationContext = createContext<RewardNotificationContextValue | undefined>(
  undefined,
);

function mapLegacyGamifiedEvent(
  event: Omit<GamifiedEvent, 'id' | 'timestamp'>,
): ShowRewardInput | null {
  const { type, payload } = event;

  switch (type as GamifiedEventType) {
    case 'DAILY_LOGIN_CLAIMED':
      return {
        type: 'daily-login',
        xp: payload.xpGained,
        points: payload.pointsGained,
        streak: payload.streakCount,
      };
    case 'NEW_BADGE_UNLOCKED':
      return {
        type: 'badge-unlocked',
        badgeTitle: payload.badgeTitle,
        badgeImageUrl: payload.badgeImageUrl,
        xp: payload.xpGained,
        points: payload.pointsGained,
      };
    case 'LEVEL_UP':
      return {
        type: 'level-up',
        level: payload.level,
        levelTitle: payload.levelTitle,
        xp: payload.xpGained,
        points: payload.pointsGained,
      };
    case 'SYSTEM_ALERT':
      return {
        type: 'system-alert',
        title: payload.title,
        message: payload.message,
        description: payload.description,
      };
    case 'REWARD_EARNED':
      return {
        type: 'lesson-complete',
        title: payload.title,
        description: payload.description ?? payload.message,
        xp: payload.xpGained,
        points: payload.pointsGained,
      };
    default:
      return null;
  }
}

export function RewardNotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveReward[]>([]);
  const [modalReward, setModalReward] = useState<ActiveReward | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissModal = useCallback(() => {
    setModalReward(null);
  }, []);

  const showReward = useCallback(
    (input: ShowRewardInput) => {
      const id = Math.random().toString(36).slice(2, 10);
      const reward: ActiveReward = {
        id,
        timestamp: Date.now(),
        tier: getRewardTier(input.type),
        ...input,
      };

      if (reward.tier === 'small') {
        setToasts((prev) => [...prev, reward]);
        window.setTimeout(() => dismissToast(id), SMALL_REWARD_AUTO_DISMISS_MS);
        return;
      }

      setModalReward(reward);
    },
    [dismissToast],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onRewardNotification = (event: Event) => {
      const customEvent = event as CustomEvent<ShowRewardInput>;
      if (customEvent.detail?.type) {
        showReward(customEvent.detail);
      }
    };

    const onLegacyGamifiedEvent = (event: Event) => {
      const customEvent = event as CustomEvent<Omit<GamifiedEvent, 'id' | 'timestamp'>>;
      if (!customEvent.detail?.type) return;
      const mapped = mapLegacyGamifiedEvent(customEvent.detail);
      if (mapped) showReward(mapped);
    };

    window.addEventListener('reward-notification', onRewardNotification);
    window.addEventListener('gamified-event', onLegacyGamifiedEvent);

    return () => {
      window.removeEventListener('reward-notification', onRewardNotification);
      window.removeEventListener('gamified-event', onLegacyGamifiedEvent);
    };
  }, [showReward]);

  const value = useMemo(
    () => ({
      toasts,
      modalReward,
      showReward,
      dismissToast,
      dismissModal,
    }),
    [toasts, modalReward, showReward, dismissToast, dismissModal],
  );

  return (
    <RewardNotificationContext.Provider value={value}>{children}</RewardNotificationContext.Provider>
  );
}

export function useRewardNotification() {
  const context = useContext(RewardNotificationContext);
  if (!context) {
    throw new Error('useRewardNotification must be used within a RewardNotificationProvider');
  }
  return context;
}

/** Backward-compatible alias for existing gamified event consumers. */
export function useGamifiedEvent() {
  const { toasts, showReward, dismissToast } = useRewardNotification();

  return {
    toasts,
    triggerGamifiedEvent: (eventData: Omit<GamifiedEvent, 'id' | 'timestamp'>) => {
      const mapped = mapLegacyGamifiedEvent(eventData);
      if (mapped) showReward(mapped);
    },
    dismissGamifiedEvent: dismissToast,
  };
}
