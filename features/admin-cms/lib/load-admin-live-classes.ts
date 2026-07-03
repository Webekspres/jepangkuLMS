import { cache } from 'react';
import type { LevelJLPT } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type AdminLiveClassRow = {
  id: string;
  title: string;
  senseiName: string;
  category: string;
  level: LevelJLPT;
  priceIdr: number;
  sessionCount: number;
  nextSessionAt: string | null;
  maxSlots: number;
  filledSlots: number;
  isPublished: boolean;
};

export type AdminLiveClassSessionInput = {
  id?: string;
  title: string;
  scheduledAt: string;
  endsAt: string;
  meetingUrl: string | null;
  recordingUrl: string | null;
};

export const loadAdminLiveClasses = cache(async function loadAdminLiveClasses(): Promise<
  AdminLiveClassRow[]
> {
  const rows = await prisma.liveClass.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      sessions: { orderBy: { scheduledAt: 'asc' } },
    },
  });

  const now = new Date();

  return rows.map((row) => {
    const upcoming = row.sessions.find((session) => session.scheduledAt >= now);
    const nextSession = upcoming ?? row.sessions.at(-1) ?? null;
    return {
      id: row.id,
      title: row.title,
      senseiName: row.senseiName,
      category: row.category,
      level: row.level,
      priceIdr: row.priceIdr,
      sessionCount: row.sessions.length,
      nextSessionAt: nextSession ? nextSession.scheduledAt.toISOString() : null,
      maxSlots: row.maxSlots,
      filledSlots: row.filledSlots,
      isPublished: row.isPublished,
    };
  });
});

export async function loadAdminLiveClassById(id: string) {
  const row = await prisma.liveClass.findUnique({
    where: { id },
    include: { sessions: { orderBy: { scheduledAt: 'asc' } } },
  });
  if (!row) return null;
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
    thumbUrl: row.thumbUrl,
    paymentLink: row.paymentLink,
    isPublished: row.isPublished,
    sessions: row.sessions.map((session) => ({
      id: session.id,
      title: session.title,
      scheduledAt: session.scheduledAt.toISOString().slice(0, 16),
      endsAt: session.endsAt.toISOString().slice(0, 16),
      meetingUrl: session.meetingUrl,
      recordingUrl: session.recordingUrl,
    })),
  };
}
