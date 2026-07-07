'use client';

import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { getCoreLevelProgress } from '@/features/student/lib/gamification-rewards';
import { cn } from '@/lib/utils';
import { ProfileAvatar } from './profile-avatar';

type StudentProfileMenuHeaderProps = {
  displayName: string;
  badgeTitle?: string | null;
  level: number;
  levelTitle?: string | null;
  totalXp: number;
  imageUrl?: string | null;
  initial: string;
  email?: string | null;
  onClose?: () => void;
  className?: string;
};

function EquippedBadgePill({ title }: { title: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-secondary/20 bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground dark:border-brand-yellow/30 dark:bg-brand-yellow/15 dark:text-brand-yellow">
      {title}
    </span>
  );
}

export function StudentProfileMenuHeader({
  displayName,
  badgeTitle,
  level,
  levelTitle,
  totalXp,
  imageUrl,
  initial,
  email,
  onClose,
  className,
}: StudentProfileMenuHeaderProps) {
  const nextLevel = level + 1;
  const levelProgress = getCoreLevelProgress(totalXp, level);
  const levelSubtitle = levelTitle ? `${levelTitle} • Lv.${level}` : `Pemula • Lv.${level}`;

  return (
    <div className={cn('border-b border-border bg-primary/5 p-4 dark:bg-primary/10', className)}>
      <div className="mb-3 flex items-start gap-3">
        <ProfileAvatar size="lg" imageUrl={imageUrl} initial={initial} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
            {badgeTitle ? (
              <EquippedBadgePill title={badgeTitle} />
            ) : (
              <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                Level {level}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{levelSubtitle}</p>
          {email ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground/80">{email}</p>
          ) : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            aria-label="Tutup menu"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      <div>
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-muted-foreground">
            {levelProgress.isMaxLevel ? 'Level maksimum' : `XP ke Lv.${nextLevel}`}
          </span>
          <span className="font-bold text-primary">{levelProgress.percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-primary to-brand-yellow"
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress.percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {levelProgress.isMaxLevel ? (
            <>{formatDisplayNumber(totalXp)} XP total</>
          ) : (
            <>
              Sisa{' '}
              <span className="font-semibold text-foreground">
                {formatDisplayNumber(levelProgress.xpRemaining)} XP
              </span>{' '}
              menuju Lv.{nextLevel}
              <span className="text-muted-foreground/70">
                {' '}
                · {formatDisplayNumber(totalXp)} XP total
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
