import { cache } from 'react';
import type { LevelJLPT } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type AdminLiveClassRow = {
  id: string;
  title: string;
  senseiName: string;
  category: string;
  level: LevelJLPT;
  scheduledAt: string;
  maxSlots: number;
  filledSlots: number;
  isPublished: boolean;
};

export const loadAdminLiveClasses = cache(async function loadAdminLiveClasses(): Promise<
  AdminLiveClassRow[]
> {
  const rows = await prisma.liveClass.findMany({
    orderBy: { scheduledAt: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    senseiName: row.senseiName,
    category: row.category,
    level: row.level,
    scheduledAt: row.scheduledAt.toISOString(),
    maxSlots: row.maxSlots,
    filledSlots: row.filledSlots,
    isPublished: row.isPublished,
  }));
});

export async function loadAdminLiveClassById(id: string) {
  const row = await prisma.liveClass.findUnique({ where: { id } });
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    senseiName: row.senseiName,
    senseiLevel: row.senseiLevel,
    category: row.category,
    level: row.level,
    scheduledAt: row.scheduledAt.toISOString().slice(0, 16),
    endsAt: row.endsAt?.toISOString().slice(0, 16) ?? '',
    maxSlots: row.maxSlots,
    filledSlots: row.filledSlots,
    thumbUrl: row.thumbUrl,
    meetingUrl: row.meetingUrl,
    isPublished: row.isPublished,
  };
}
