'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Award, Coins, Sparkles, Swords, X, Zap } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useGamifiedEvent } from './gamified-event-context';
import type { GamifiedEvent } from '../types/gamified-event';

export function GamifiedEventToaster() {
  const { toasts, dismissGamifiedEvent } = useGamifiedEvent();

  return (
    <AnimatePresence>
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 z-[100] flex w-full -translate-x-1/2 flex-col items-center gap-3 px-4 sm:max-w-md pointer-events-none">
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

  let title = '';
  let subText: React.ReactNode = null;
  let themeBorderClass = 'border-brand-yellow/30 shadow-brand-yellow/10';
  let glowColor = 'bg-brand-yellow/10';
  let iconNode: React.ReactNode = null;

  switch (type) {
    case 'NEW_BADGE_UNLOCKED':
      title = 'Pencapaian Baru Terbuka! 🏆';
      subText = (
        <span>
          Selamat! Kamu berhasil mendapatkan Badge{' '}
          <strong className="text-brand-yellow font-black">{payload.badgeTitle}</strong>.
        </span>
      );
      themeBorderClass = 'border-brand-yellow/45 shadow-brand-yellow/20';
      glowColor = 'bg-brand-yellow/15';
      iconNode = payload.badgeImageUrl ? (
        <div className="relative size-14 shrink-0 rounded-full border border-brand-yellow/30 bg-black/40 p-1 flex items-center justify-center shadow-lg">
          <Image
            src={payload.badgeImageUrl}
            alt=""
            width={48}
            height={48}
            className="size-11 object-contain animate-bounce"
          />
          <div className="absolute inset-0 rounded-full animate-pulse border border-brand-yellow/50 opacity-40 scale-105" />
        </div>
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-amber-500/20 to-amber-900/40 border border-brand-yellow/40 text-brand-yellow shadow-lg">
          <Award className="size-8 animate-pulse text-brand-yellow drop-shadow-[0_0_6px_rgba(248,231,28,0.7)]" />
        </div>
      );
      break;

    case 'DAILY_LOGIN_CLAIMED':
      title = 'Absen Harian Berhasil! ☀️';
      const xpVal = payload.xpGained ?? 0;
      const pointsVal = payload.pointsGained ?? 0;
      const streakVal = payload.streakCount;
      subText = (
        <span>
          Kamu mendapatkan{' '}
          <strong className="text-brand-yellow font-black">+{pointsVal} Poin</strong> &amp;{' '}
          <strong className="text-brand-red font-black">+{xpVal} EXP</strong>.
          {streakVal != null ? ` Streak hari ke-${streakVal}!` : ' Pertahankan streak-mu!'}
        </span>
      );
      themeBorderClass = 'border-brand-red/35 shadow-brand-red/15';
      glowColor = 'bg-brand-red/10';
      iconNode = (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-red/20 to-brand-orange/20 border border-brand-red/40 text-brand-yellow relative shadow-lg">
          <Zap className="size-7 text-brand-red drop-shadow-[0_0_8px_rgba(236,29,36,0.8)] animate-pulse" />
          <Coins className="absolute -bottom-1 -right-1 size-5 text-brand-yellow drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-bounce" />
        </div>
      );
      break;

    case 'LEVEL_UP':
      title = 'Level Up! ⚔️';
      subText = (
        <span>
          Kerja bagus! Kamu sekarang telah mencapai{' '}
          <strong className="text-brand-yellow font-black">Level {payload.level}</strong>!
          {payload.levelTitle && (
            <>
              {' '}
              Gelar baru: <strong className="text-slate-100 font-extrabold">{payload.levelTitle}</strong>
            </>
          )}
        </span>
      );
      themeBorderClass = 'border-purple-500/40 shadow-purple-500/15';
      glowColor = 'bg-purple-500/15';
      iconNode = (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-600/30 to-indigo-900/30 border border-purple-400/50 text-purple-300 relative shadow-lg">
          <Swords className="size-7 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
          <Sparkles className="absolute -top-1 -right-1 size-4 text-brand-yellow animate-spin" />
        </div>
      );
      break;

    case 'SYSTEM_ALERT':
      title = payload.title ?? 'Koneksi Terganggu ⚠️';
      subText = <span>{payload.message}</span>;
      themeBorderClass = 'border-brand-red/35 shadow-brand-red/15';
      glowColor = 'bg-brand-red/10';
      iconNode = (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-red/20 to-brand-orange/20 border border-brand-red/40 text-brand-yellow relative shadow-lg">
          <Zap className="size-7 text-brand-red drop-shadow-[0_0_8px_rgba(236,29,36,0.8)] animate-pulse" />
        </div>
      );
      break;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={cn(
        'relative w-full rounded-2xl border bg-linear-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 p-4 pr-10 shadow-2xl backdrop-blur-md pointer-events-auto',
        themeBorderClass,
      )}
    >
      {/* Background glow slot */}
      <div className={cn('absolute -left-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-[25px] opacity-30 z-0 pointer-events-none', glowColor)} />

      <div className="relative z-10 flex items-center gap-4">
        {/* Left Visual Asset */}
        {iconNode}

        {/* Text Content */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black tracking-wider text-white uppercase leading-none mb-1.5 flex items-center gap-1">
            {title}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-300 leading-normal tracking-wide">
            {subText}
          </p>
        </div>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-lg border border-white/5 bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
        aria-label="Close alert"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}
