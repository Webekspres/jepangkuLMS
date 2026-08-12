import { unstable_cache } from 'next/cache';
import type { LevelJLPT } from '@prisma/client';
import { isLiveClassEnrollmentClosed } from '@/features/live-class/lib/live-class-access';
import type {
  PublicLiveClassDetail,
  PublicLiveClassSession,
  PublicLiveClassSummary,
} from '@/features/public-api/lib/public-live-class-types';
import { prisma } from '@/lib/prisma';

const SESSION_SELECT = {
  id: true,
  title: true,
  scheduledAt: true,
  endsAt: true,
} as const;

type SessionRow = {
  id: string;
  title: string;
  scheduledAt: Date;
  endsAt: Date;
};

type LiveClassRow = {
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
  coverImageUrl: string | null;
  sessions: SessionRow[];
};

function getPublicAppBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  return base || 'https://kursus.jepangku.com';
}

function buildLiveClassUrl(id: string): string {
  return `${getPublicAppBaseUrl()}/dashboard/live-class/${id}`;
}

function mapSessions(sessions: SessionRow[]): PublicLiveClassSession[] {
  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    scheduledAt: session.scheduledAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
  }));
}

function toPublicSummary(row: LiveClassRow, now: Date): PublicLiveClassSummary {
  const slotsRemaining = Math.max(0, row.maxSlots - row.filledSlots);
  const firstSessionAt = row.sessions[0]?.scheduledAt ?? null;
  const nextSession = row.sessions.find((s) => s.scheduledAt.getTime() >= now.getTime());

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    senseiName: row.senseiName,
    senseiLevel: row.senseiLevel,
    category: row.category,
    level: row.level,
    priceIdr: row.priceIdr,
    maxSlots: row.maxSlots,
    filledSlots: row.filledSlots,
    slotsRemaining,
    isFull: row.filledSlots >= row.maxSlots,
    isEnrollmentClosed: isLiveClassEnrollmentClosed(firstSessionAt, now),
    coverImageUrl: row.coverImageUrl,
    sessionCount: row.sessions.length,
    nextSessionAt: nextSession ? nextSession.scheduledAt.toISOString() : null,
    url: buildLiveClassUrl(row.id),
  };
}

const listPublishedLiveClasses = unstable_cache(
  async (): Promise<PublicLiveClassSummary[]> => {
    const rows = await prisma.liveClass.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          orderBy: { scheduledAt: 'asc' },
          select: SESSION_SELECT,
        },
      },
    });

    const now = new Date();
    return rows.map((row) => toPublicSummary(row, now));
  },
  ['partner-public-live-classes-list-v1'],
  { revalidate: 300 },
);

export async function getPartnerPublicLiveClasses(): Promise<PublicLiveClassSummary[]> {
  return listPublishedLiveClasses();
}

export async function getPartnerPublicLiveClassById(
  id: string,
): Promise<PublicLiveClassDetail | null> {
  const row = await prisma.liveClass.findFirst({
    where: { id, isPublished: true },
    include: {
      sessions: {
        orderBy: { scheduledAt: 'asc' },
        select: SESSION_SELECT,
      },
    },
  });

  if (!row) return null;

  return {
    ...toPublicSummary(row, new Date()),
    sessions: mapSessions(row.sessions),
  };
}
