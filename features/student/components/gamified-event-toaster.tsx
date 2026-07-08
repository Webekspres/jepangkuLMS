'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  TriangleAlert,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useGamifiedEvent } from './gamified-event-context';
import type { GamifiedEvent, GamifiedEventType } from '../types/gamified-event';

type ToastTheme = {
  card: string;
  accentBar: string;
  iconWrap: string;
};

/** Solid card surfaces — avoid low-opacity bg on floating toasts (reads as transparent). */
const TOAST_THEMES: Record<GamifiedEventType, ToastTheme> = {
  NEW_BADGE_UNLOCKED: {
    card: 'border-brand-yellow/30 bg-card shadow-xl shadow-black/10',
    accentBar: 'bg-brand-yellow',
    iconWrap: 'border-brand-yellow/40 bg-brand-yellow/15 text-brand-navy',
  },
  DAILY_LOGIN_CLAIMED: {
    card: 'border-brand-red/20 bg-card shadow-xl shadow-black/10',
    accentBar: 'bg-brand-red',
    iconWrap: 'border-brand-red/30 bg-brand-red/10 text-brand-red',
  },
  LEVEL_UP: {
    card: 'border-brand-navy/15 bg-card shadow-xl shadow-black/10',
    accentBar: 'bg-brand-navy',
    iconWrap: 'border-brand-navy/25 bg-brand-navy/10 text-brand-navy',
  },
  REWARD_EARNED: {
    card: 'border-emerald-200 bg-card shadow-xl shadow-black/10',
    accentBar: 'bg-emerald-500',
    iconWrap: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  },
  SYSTEM_ALERT: {
    card: 'border-brand-orange/30 bg-card shadow-xl shadow-black/10',
    accentBar: 'bg-brand-orange',
    iconWrap: 'border-brand-orange/30 bg-brand-orange/10 text-brand-orange',
  },
};

export function GamifiedEventToaster() {
  const { toasts, dismissGamifiedEvent } = useGamifiedEvent();

  return (
    <AnimatePresence>
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed top-20 left-1/2 z-100 flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-3 px-4">
          {toasts.map((toast) => (
            <GamifiedEventCard
              key={toast.id}
              toast={toast}
              onClose={() => dismissGamifiedEvent(toast.id)}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

function GamifiedEventCard({
  toast,
  onClose,
}: {
  toast: GamifiedEvent;
  onClose: () => void;
}) {
  const { type, payload } = toast;
  const theme = TOAST_THEMES[type];

  let title = '';
  let subText: React.ReactNode = null;
  let iconNode: React.ReactNode = null;

  switch (type) {
    case 'NEW_BADGE_UNLOCKED':
      title = 'Pencapaian Baru Terbuka!';
      subText = (
        <span>
          Selamat! Kamu mendapatkan badge{' '}
          <strong className="font-semibold text-brand-navy">{payload.badgeTitle}</strong>.
        </span>
      );
      iconNode = payload.badgeImageUrl ? (
        <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-yellow/40 bg-card p-1 shadow-sm">
          <Image
            src={payload.badgeImageUrl}
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
          <Award className="size-5" strokeWidth={2.25} />
        </div>
      );
      break;

    case 'DAILY_LOGIN_CLAIMED': {
      title = 'Absen Harian Berhasil!';
      const xpVal = payload.xpGained ?? 0;
      const pointsVal = payload.pointsGained ?? 0;
      const streakVal = payload.streakCount;
      subText = (
        <span>
          Kamu mendapatkan{' '}
          <strong className="font-semibold text-yellow-600">+{pointsVal} Poin</strong>
          {xpVal > 0 ? (
            <>
              {' '}
              &amp; <strong className="font-semibold text-brand-red">+{xpVal} EXP</strong>
            </>
          ) : null}
          .
          {streakVal != null ? ` Streak hari ke-${streakVal}!` : ' Pertahankan streak-mu!'}
        </span>
      );
      iconNode = (
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full border',
            theme.iconWrap,
          )}
        >
          <CalendarCheck className="size-5" strokeWidth={2.25} />
        </div>
      );
      break;
    }

    case 'LEVEL_UP':
      title = 'Naik Level!';
      subText = (
        <span>
          Kamu mencapai{' '}
          <strong className="font-semibold text-brand-navy">Level {payload.level}</strong>
          {payload.levelTitle ? (
            <>
              {' '}
              — gelar baru:{' '}
              <strong className="font-semibold text-brand-navy">{payload.levelTitle}</strong>
            </>
          ) : null}
          .
        </span>
      );
      iconNode = (
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full border',
            theme.iconWrap,
          )}
        >
          <TrendingUp className="size-5" strokeWidth={2.25} />
        </div>
      );
      break;

    case 'REWARD_EARNED': {
      title = payload.title ?? 'Progress Tercatat';
      const xpVal = payload.xpGained ?? 0;
      const pointsVal = payload.pointsGained ?? 0;
      const detailText = payload.description ?? payload.message;
      subText = (
        <span>
          {detailText ? <>{detailText}</> : null}
          {(xpVal > 0 || pointsVal > 0) && (
            <>
              {detailText ? <br /> : null}
              {pointsVal > 0 && (
                <>
                  <strong className="font-semibold text-yellow-600">+{pointsVal} Poin</strong>
                  {xpVal > 0 ? ' & ' : ''}
                </>
              )}
              {xpVal > 0 && (
                <strong className="font-semibold text-brand-red">+{xpVal} EXP</strong>
              )}
            </>
          )}
        </span>
      );
      iconNode = (
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full border',
            theme.iconWrap,
          )}
        >
          <CheckCircle2 className="size-5" strokeWidth={2.25} />
        </div>
      );
      break;
    }

    case 'SYSTEM_ALERT':
      title = payload.title ?? 'Perhatian';
      subText = <span>{payload.message}</span>;
      iconNode = (
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full border',
            theme.iconWrap,
          )}
        >
          <TriangleAlert className="size-5" strokeWidth={2.25} />
        </div>
      );
      break;
  }

  if (!title) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'pointer-events-auto relative w-full overflow-hidden rounded-xl border p-4 pr-10',
        theme.card,
      )}
    >
      <div
        className={cn('absolute top-0 bottom-0 left-0 w-1', theme.accentBar)}
        aria-hidden
      />

      <div className="relative flex items-start gap-3 pl-2">
        {iconNode}

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="mb-1 text-sm leading-snug font-semibold text-brand-navy">{title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{subText}</p>
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
    </motion.div>
  );
}
