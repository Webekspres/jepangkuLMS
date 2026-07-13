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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { RewardAnimation } from './reward-animation';
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

type RewardBottomSheetProps = {
  reward: ActiveReward;
  open: boolean;
  onContinue: () => void;
};

export function RewardBottomSheet({ reward, open, onContinue }: RewardBottomSheetProps) {
  const presentation = resolveRewardPresentation(reward);
  const Icon = ICONS[presentation.icon];
  const iconWrap = ACCENT_STYLES[presentation.accent];
  const xp = reward.xp ?? 0;
  const points = reward.points ?? 0;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onContinue()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[min(45vh,28rem)] rounded-t-3xl border-t px-0 pb-0"
      >
        <RewardAnimation variant="sheet" className="flex h-full flex-col">
          <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-muted" aria-hidden />

          <SheetHeader className="items-center px-5 pt-2 text-center sm:px-6">
            {reward.badgeImageUrl ? (
              <div className="relative mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-brand-yellow/40 bg-card p-2 shadow-sm">
                <Image
                  src={reward.badgeImageUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 object-contain"
                />
              </div>
            ) : (
              <div
                className={cn(
                  'mx-auto mb-3 flex size-14 items-center justify-center rounded-full border',
                  iconWrap,
                )}
              >
                <Icon className="size-7" strokeWidth={2.1} />
              </div>
            )}

            <SheetTitle className="font-heading text-base text-brand-navy sm:text-lg">
              {presentation.title}
            </SheetTitle>
            {presentation.description ? (
              <SheetDescription className="text-[0.875rem] leading-relaxed">
                {presentation.description}
              </SheetDescription>
            ) : null}
          </SheetHeader>

          {(xp > 0 || points > 0) && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 px-5 sm:px-6">
              {points > 0 ? (
                <span className="rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-3 py-1 text-[0.875rem] font-semibold text-yellow-700">
                  +{points} Poin
                </span>
              ) : null}
              {xp > 0 ? (
                <span className="rounded-full border border-brand-red/20 bg-brand-red/10 px-3 py-1 text-[0.875rem] font-semibold text-brand-red">
                  +{xp} EXP
                </span>
              ) : null}
            </div>
          )}

          <SheetFooter className="mt-auto border-t border-border/70 px-5 pt-3 pb-safe-lg sm:px-6">
            <Button
              className="h-10 w-full bg-brand-red text-[0.875rem] hover:bg-brand-orange"
              onClick={onContinue}
            >
              Lanjutkan
            </Button>
          </SheetFooter>
        </RewardAnimation>
      </SheetContent>
    </Sheet>
  );
}
