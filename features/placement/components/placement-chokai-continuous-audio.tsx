'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Phase = 'idle' | 'playing' | 'ended' | 'missing';

type PlacementChokaiContinuousAudioProps = {
  audioUrl: string | null;
  className?: string;
};

/** Pixel heights for a 5-bar equalizer (center tallest). */
const EQ_BAR_HEIGHTS_PX = [6, 10, 14, 10, 6] as const;

function AudioEqualizerIcon({ active }: { active: boolean }) {
  return (
    <div className="flex h-4 items-end gap-0.5" aria-hidden>
      {EQ_BAR_HEIGHTS_PX.map((heightPx, i) => (
        <span
          key={i}
          className={cn('w-1 rounded-full bg-foreground/85', active && 'placement-eq-bar')}
          style={{
            height: heightPx,
            animationDelay: active ? `${i * 0.12}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

function formatClock(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Shell-level Choukai player: one start via equalizer tap, continuous play, no pause/seek.
 * Survives question navigation when mounted above the question card.
 */
export function PlacementChokaiContinuousAudio({
  audioUrl,
  className,
}: PlacementChokaiContinuousAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [phase, setPhase] = useState<Phase>(audioUrl ? 'idle' : 'missing');
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;

    const onTime = () => setElapsed(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnded = () => setPhase('ended');
    const onError = () => setPhase('missing');

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);

    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [audioUrl]);

  async function handleStart() {
    const el = audioRef.current;
    if (!el || phase !== 'idle') return;
    try {
      await el.play();
      setPhase('playing');
    } catch {
      setPhase('missing');
    }
  }

  const isPlaying = phase === 'playing';
  const canStart = phase === 'idle' && Boolean(audioUrl);

  const progressPct =
    phase === 'ended'
      ? 100
      : duration > 0
        ? Math.min(100, Math.max(0, (elapsed / duration) * 100))
        : 0;

  const displayElapsed = phase === 'ended' && duration > 0 ? duration : elapsed;

  if (phase === 'missing') {
    return (
      <div
        className={cn(
          'rounded-2xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-900',
          className,
        )}
      >
        Audio belum tersedia — lanjutkan ujian tanpa suara.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5',
        className,
      )}
    >
      {audioUrl ? (
        <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden">
          <track kind="captions" />
        </audio>
      ) : null}

      <div className="flex items-center gap-3">
        {canStart ? (
          <button
            type="button"
            onClick={() => void handleStart()}
            aria-label="Mulai mendengar"
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm transition',
              'hover:border-emerald-500/50 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <AudioEqualizerIcon active={false} />
          </button>
        ) : (
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm',
              isPlaying && 'border-emerald-500/40 bg-emerald-500/10',
            )}
            aria-hidden
          >
            <AudioEqualizerIcon active={isPlaying} />
          </div>
        )}

        <div
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-emerald-500/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
          aria-label="Progress audio"
        >
          <div
            className="h-full rounded-full bg-emerald-600 transition-[width] duration-150 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatClock(displayElapsed)}
          {duration > 0 ? ` / ${formatClock(duration)}` : ''}
        </span>
      </div>
    </div>
  );
}
