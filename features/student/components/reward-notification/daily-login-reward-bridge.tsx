'use client';

import { useEffect, useRef } from 'react';
import type { DailyLoginAward } from '@/lib/lms/points';
import { useRewardNotification } from './reward-notification-context';

type DailyLoginRewardBridgeProps = {
  reward?: DailyLoginAward | null;
};

export function DailyLoginRewardBridge({ reward }: DailyLoginRewardBridgeProps) {
  const { showReward } = useRewardNotification();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!reward || shownRef.current) return;
    shownRef.current = true;

    showReward({
      type: 'daily-login',
      xp: reward.xpGained,
      points: reward.pointsGained,
      streak: reward.streak,
    });
  }, [reward, showReward]);

  return null;
}
