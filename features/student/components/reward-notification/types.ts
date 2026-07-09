export type RewardTier = 'small' | 'medium' | 'large';

export type RewardType =
  | 'daily-login'
  | 'lesson-complete'
  | 'quiz-pass'
  | 'quiz-complete'
  | 'flashcard-complete'
  | 'reading-complete'
  | 'module-complete'
  | 'course-complete'
  | 'badge-unlocked'
  | 'achievement-unlocked'
  | 'certificate-earned'
  | 'login-streak-milestone'
  | 'level-up'
  | 'system-alert';

export type RewardPayload = {
  xp?: number;
  points?: number;
  streak?: number;
  title?: string;
  description?: string;
  message?: string;
  badgeTitle?: string;
  badgeImageUrl?: string;
  level?: number;
  levelTitle?: string;
};

export type ShowRewardInput = {
  type: RewardType;
} & RewardPayload;

export type ActiveReward = ShowRewardInput & {
  id: string;
  tier: RewardTier;
  timestamp: number;
};

export const REWARD_NOTIFICATION_EVENT = 'reward-notification';
export const LEGACY_GAMIFIED_EVENT = 'gamified-event';
