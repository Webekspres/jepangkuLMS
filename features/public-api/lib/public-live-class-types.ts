import type { LevelJLPT } from '@prisma/client';

export type PublicLiveClassSummary = {
  id: string;
  title: string;
  description: string;
  senseiName: string;
  senseiLevel: string | null;
  category: string;
  level: LevelJLPT;
  priceIdr: number;
  maxSlots: number;
  filledSlots: number;
  slotsRemaining: number;
  isFull: boolean;
  isEnrollmentClosed: boolean;
  coverImageUrl: string | null;
  sessionCount: number;
  /** ISO datetime of the earliest upcoming session, or null */
  nextSessionAt: string | null;
  /** Deep link to LMS live-class detail (auth-gated) */
  url: string;
};

export type PublicLiveClassSession = {
  id: string;
  title: string;
  /** ISO datetime */
  scheduledAt: string;
  /** ISO datetime */
  endsAt: string;
};

export type PublicLiveClassDetail = PublicLiveClassSummary & {
  sessions: PublicLiveClassSession[];
};
