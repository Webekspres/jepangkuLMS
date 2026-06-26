export type GamifiedEventType = 'NEW_BADGE_UNLOCKED' | 'DAILY_LOGIN_CLAIMED' | 'LEVEL_UP';

export interface GamifiedEventPayload {
  badgeTitle?: string;
  badgeImageUrl?: string;
  xpGained?: number;
  pointsGained?: number;
  streakCount?: number;
  level?: number;
  levelTitle?: string;
}

export interface GamifiedEvent {
  id: string;
  type: GamifiedEventType;
  timestamp: number;
  payload: GamifiedEventPayload;
}
