import { cache } from 'react';
import type { LevelJLPT } from '@prisma/client';
import { DEFAULT_TRYOUT_COVER } from '@/features/learning/lib/load-marketing-catalog-extras';
import { formatJakartaDateLong } from '@/lib/jakarta-calendar';
import { prisma } from '@/lib/prisma';

export type MarketingTryoutDetail = {
  id: string;
  code: string;
  title: string;
  description: string;
  phaseLabel: string;
  level: LevelJLPT;
  priceIdr: number;
  timeLimitMinutes: number;
  scheduledAtLabel: string | null;
  coverSrc: string;
};

export const loadMarketingTryoutDetail = cache(
  async function loadMarketingTryoutDetail(
    sessionCode: string,
  ): Promise<MarketingTryoutDetail | null> {
    const code = decodeURIComponent(sessionCode);
    const row = await prisma.tryoutSession.findFirst({
      where: { code, isActive: true },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        phaseLabel: true,
        level: true,
        priceIdr: true,
        timeLimitMinutes: true,
        scheduledAt: true,
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description?.trim() || row.phaseLabel,
      phaseLabel: row.phaseLabel,
      level: row.level,
      priceIdr: row.priceIdr,
      timeLimitMinutes: row.timeLimitMinutes,
      scheduledAtLabel: row.scheduledAt ? formatJakartaDateLong(row.scheduledAt) : null,
      coverSrc: DEFAULT_TRYOUT_COVER,
    };
  },
);
