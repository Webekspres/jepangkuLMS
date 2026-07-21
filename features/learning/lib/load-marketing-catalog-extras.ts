import { cache } from 'react';
import {
  DEFAULT_THUMB,
  resolveLiveClassCoverUrl,
} from '@/features/learning/lib/course-display';
import { prisma } from '@/lib/prisma';

/** Cover-only card for marketing `/kursus` (live class & tryout teaser). */
export type MarketingCoverItem = {
  id: string;
  title: string;
  coverSrc: string;
  level: string;
};

/** Tryout belum punya `coverImageUrl` di schema — pakai asset default. */
export const DEFAULT_TRYOUT_COVER = DEFAULT_THUMB;

export const loadMarketingLiveClassCovers = cache(
  async function loadMarketingLiveClassCovers(): Promise<MarketingCoverItem[]> {
    const rows = await prisma.liveClass.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        level: true,
        coverImageUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      level: row.level,
      coverSrc: resolveLiveClassCoverUrl(row.coverImageUrl),
    }));
  },
);

export const loadMarketingTryoutCovers = cache(
  async function loadMarketingTryoutCovers(): Promise<MarketingCoverItem[]> {
    const rows = await prisma.tryoutSession.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        level: true,
        code: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      level: row.level,
      coverSrc: DEFAULT_TRYOUT_COVER,
    }));
  },
);
