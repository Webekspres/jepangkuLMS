'use client';

import {
  Award,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  TriangleAlert,
  Trophy,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { RewardAnimation } from './reward-animation';
import { resolveRewardPresentation } from './reward-config';
import type { ActiveReward } from './types';

const ACCENT_STYLES = {
  emerald: {
    card: 'border-emerald-200 bg-card shadow-xl shadow-black/10',
    accentBar: 'bg-emerald-500',
    iconWrap: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  },
  red: {
    card: 'border-brand-red/20 bg-card shadow-xl shadow-black/10',
    accentBar: 'bg-brand-red',
    iconWrap: 'border-brand-red/30 bg-brand-red/10 text-brand-red',
  },
  yellow: {
    card: 'border-brand-yellow/30 bg-card shadow-xl shadow-black/10',
    accentBar: 'bg-brand-yellow',
    iconWrap: 'border-brand-yellow/40 bg-brand-yellow/15 text-brand-navy',
  },
  navy: {
    card: 'border-brand-navy/15 bg-card shadow-xl shadow-black/10',
    accentBar: 'bg-brand-navy',
    iconWrap: 'border-brand-navy/25 bg-brand-navy/10 text-brand-navy',
  },
  orange: {
    card: 'border-brand-orange/30 bg-card shadow-xl shadow-black/10',
    accentBar: 'bg-brand-orange',
    iconWrap: 'border-brand-orange/30 bg-brand-orange/10 text-brand-orange',
  },
} as const;

const ICONS = {
  check: CheckCircle2,
  calendar: CalendarCheck,
  award: Award,
  trophy: Trophy,
  trending: TrendingUp,
  alert: TriangleAlert,
} as const;

function RewardXpPoints({ reward }: { reward: ActiveReward }) {
  const xp = reward.xp ?? 0;
  const points = reward.points ?? 0;
  if (xp <= 0 && points <= 0) return null;

  return (
    <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
      {points > 0 && <strong className="font-semibold text-yellow-600">+{points} Poin</strong>}
      {points > 0 && xp > 0 ? ' & ' : null}
      {xp > 0 && <strong className="font-semibold text-brand-red">+{xp} EXP</strong>}
    </p>
  );
}

export function RewardToast({
  reward,
  onClose,
}: {
  reward: ActiveReward;
  onClose: () => void;
}) {
  const presentation = resolveRewardPresentation(reward);
  const theme = ACCENT_STYLES[presentation.accent];
  const Icon = ICONS[presentation.icon];

  return (
    <RewardAnimation variant="toast" className="pointer-events-auto relative w-full">
      <div className={cn('relative overflow-hidden rounded-xl border p-4 pr-10', theme.card)}>
        <div className={cn('absolute top-0 bottom-0 left-0 w-1', theme.accentBar)} aria-hidden />

        <div className="relative flex items-start gap-3 pl-2">
          {reward.badgeImageUrl ? (
            <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-yellow/40 bg-card p-1 shadow-sm">
              <Image
                src={reward.badgeImageUrl}
                alt=""
                width={36}
                height={36}
                className="size-9 object-contain"
              />
            </div>
          ) : (
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full border',
                theme.iconWrap,
              )}
            >
              <Icon className="size-5" strokeWidth={2.25} />
            </div>
          )}

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="mb-1 text-sm leading-snug font-semibold text-brand-navy">
              {presentation.title}
            </p>
            {presentation.description ? (
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {presentation.description}
              </p>
            ) : null}
            <RewardXpPoints reward={reward} />
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Tutup notifikasi"
        >
          <X className="size-4" />
        </button>
      </div>
    </RewardAnimation>
  );
}
