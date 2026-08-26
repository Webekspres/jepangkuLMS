import { cache } from 'react';
import {
  DEFAULT_THUMB,
  resolveLiveClassCoverUrl,
} from '@/features/learning/lib/course-display';
import { prisma } from '@/lib/prisma';

/** Card data for marketing `/kursus` Live Class & Tryout sections. */
export type MarketingCoverItem = {
  id: string;
  title: string;
  description: string;
  coverSrc: string;
  level: string;
  priceIdr: number;
  /** Public detail path — `/live-class/[id]` or `/tryout/[code]`. */
  detailHref: string;
  /** Optional meta line (slots / duration). */
  metaLabel?: string;
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
        description: true,
        level: true,
        priceIdr: true,
        coverImageUrl: true,
        maxSlots: true,
        filledSlots: true,
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      level: row.level,
      priceIdr: row.priceIdr,
      coverSrc: resolveLiveClassCoverUrl(row.coverImageUrl),
      detailHref: `/live-class/${row.id}`,
      metaLabel: `${row._count.sessions} pertemuan · ${row.filledSlots}/${row.maxSlots} slot`,
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
        description: true,
        level: true,
        code: true,
        priceIdr: true,
        phaseLabel: true,
        timeLimitMinutes: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description?.trim() || row.phaseLabel,
      level: row.level,
      priceIdr: row.priceIdr,
      coverSrc: DEFAULT_TRYOUT_COVER,
      detailHref: `/tryout/${encodeURIComponent(row.code)}`,
      metaLabel: `${row.phaseLabel} · ${row.timeLimitMinutes} menit`,
    }));
  },
);
