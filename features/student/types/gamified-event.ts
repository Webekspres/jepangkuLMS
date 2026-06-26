export type GamifiedEventType = 'NEW_BADGE_UNLOCKED' | 'DAILY_LOGIN_CLAIMED' | 'LEVEL_UP' | 'SYSTEM_ALERT';

export interface GamifiedEventPayload {
  badgeTitle?: string;
  badgeImageUrl?: string;
  xpGained?: number;
  pointsGained?: number;
  streakCount?: number;
  level?: number;
  levelTitle?: string;
  title?: string;
  message?: string;
}

export interface GamifiedEvent {
  id: string;
  type: GamifiedEventType;
  timestamp: number;
  payload: GamifiedEventPayload;
}
