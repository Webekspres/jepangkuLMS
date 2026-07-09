'use client';

import {
  Award,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  TriangleAlert,
  Trophy,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { RewardAnimation, RewardSparkles } from './reward-animation';
import { resolveRewardPresentation } from './reward-config';
import type { ActiveReward } from './types';

const ACCENT_STYLES = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  red: 'border-brand-red/30 bg-brand-red/10 text-brand-red',
  yellow: 'border-brand-yellow/40 bg-brand-yellow/15 text-brand-navy',
  navy: 'border-brand-navy/25 bg-brand-navy/10 text-brand-navy',
  orange: 'border-brand-orange/30 bg-brand-orange/10 text-brand-orange',
} as const;

const ICONS = {
  check: CheckCircle2,
  calendar: CalendarCheck,
  award: Award,
  trophy: Trophy,
  trending: TrendingUp,
  alert: TriangleAlert,
} as const;

function RewardStats({ reward }: { reward: ActiveReward }) {
  const xp = reward.xp ?? 0;
  const points = reward.points ?? 0;
  if (xp <= 0 && points <= 0) return null;

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {points > 0 ? (
        <span className="rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-3 py-1 text-sm font-semibold text-yellow-700">
          +{points} Poin
        </span>
      ) : null}
      {xp > 0 ? (
        <span className="rounded-full border border-brand-red/20 bg-brand-red/10 px-3 py-1 text-sm font-semibold text-brand-red">
          +{xp} EXP
        </span>
      ) : null}
    </div>
  );
}

type RewardDialogProps = {
  reward: ActiveReward;
  open: boolean;
  onContinue: () => void;
};

export function RewardDialog({ reward, open, onContinue }: RewardDialogProps) {
  const presentation = resolveRewardPresentation(reward);
  const isCelebration = reward.tier === 'large';
  const Icon = ICONS[presentation.icon];
  const iconWrap = ACCENT_STYLES[presentation.accent];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onContinue()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'overflow-hidden border-border/80 p-0 sm:max-w-md',
          isCelebration && 'sm:max-w-lg',
        )}
      >
        <RewardAnimation variant={isCelebration ? 'celebration' : 'dialog'}>
          <div
            className={cn(
              'relative px-6 pt-8 pb-2 text-center',
              isCelebration && 'bg-linear-to-b from-brand-yellow/10 to-transparent',
            )}
          >
            {isCelebration ? <RewardSparkles /> : null}

            {reward.badgeImageUrl ? (
              <div className="relative mx-auto mb-4 flex size-20 items-center justify-center rounded-full border border-brand-yellow/40 bg-card p-2 shadow-sm">
                <Image
                  src={reward.badgeImageUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 object-contain"
                />
              </div>
            ) : (
              <div
                className={cn(
                  'mx-auto mb-4 flex size-16 items-center justify-center rounded-full border',
                  iconWrap,
                  isCelebration && 'size-20',
                )}
              >
                <Icon className={cn('size-8', isCelebration && 'size-10')} strokeWidth={2.1} />
              </div>
            )}

            <DialogHeader className="items-center text-center">
              <DialogTitle className="font-heading text-xl text-brand-navy">
                {presentation.title}
              </DialogTitle>
              {presentation.description ? (
                <DialogDescription className="max-w-sm text-sm leading-relaxed">
                  {presentation.description}
                </DialogDescription>
              ) : null}
            </DialogHeader>

            <RewardStats reward={reward} />
          </div>

          <DialogFooter className="border-t border-border/70 px-6 py-4">
            <Button className="w-full bg-brand-red hover:bg-brand-orange" onClick={onContinue}>
              {isCelebration ? 'Lanjut Belajar' : 'Lanjutkan'}
            </Button>
          </DialogFooter>
        </RewardAnimation>
      </DialogContent>
    </Dialog>
  );
}
