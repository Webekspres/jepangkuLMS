import { StudentCoreDataHydrator } from '@/features/student/components/student-core-data-hydrator';
import { DisplayNameSetupGate } from '@/features/student/components/display-name-setup-gate';
import { StudentShell } from '@/features/student/components/student-shell';
import type { DailyLoginAward } from '@/lib/lms/points';
import {
  DailyLoginRewardBridge,
  RewardNotification,
  RewardNotificationProvider,
} from './reward-notification';

/** Shell langsung; Core gamification di-hydrate client-side (tidak block SSR halaman LMS). */
export function StudentCoreDataBoundary({
  children,
  dailyLoginReward,
}: {
  children: React.ReactNode;
  dailyLoginReward?: DailyLoginAward | null;
}) {
  return (
    <StudentCoreDataHydrator>
      <RewardNotificationProvider>
        <RewardNotification />
        <DailyLoginRewardBridge reward={dailyLoginReward} />
        <StudentShell>
          <DisplayNameSetupGate />
          {children}
        </StudentShell>
      </RewardNotificationProvider>
    </StudentCoreDataHydrator>
  );
}
