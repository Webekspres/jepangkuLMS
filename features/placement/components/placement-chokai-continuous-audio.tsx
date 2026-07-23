'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Radio, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Phase = 'idle' | 'playing' | 'ended' | 'missing';

type PlacementChokaiContinuousAudioProps = {
  audioUrl: string | null;
  className?: string;
};

/**
 * Shell-level Choukai player: one start, continuous play, no pause/seek UI.
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

  return (
    <div
      className={cn(
        'rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4',
        className,
      )}
    >
      {audioUrl ? (
        <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden">
          <track kind="captions" />
        </audio>
      ) : null}

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-800">
          <Radio className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Audio 聴解 (pita kontinu)</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Setelah dimulai, audio tetap jalan saat ganti soal — tidak bisa di-pause.
          </p>

          {phase === 'idle' ? (
            <Button type="button" className="mt-3 w-full gap-2 sm:w-auto" onClick={() => void handleStart()}>
              <Volume2 className="size-4" />
              Mulai mendengar
            </Button>
          ) : null}

          {phase === 'playing' ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-emerald-800">
              <Loader2 className="size-4 animate-spin" />
              Sedang diputar
              <span className="tabular-nums text-muted-foreground">
                {formatClock(elapsed)}
                {duration > 0 ? ` / ${formatClock(duration)}` : ''}
              </span>
            </div>
          ) : null}

          {phase === 'ended' ? (
            <p className="mt-3 text-sm font-medium text-muted-foreground">Audio selesai.</p>
          ) : null}

          {phase === 'missing' ? (
            <p className="mt-3 text-sm text-amber-800">
              File audio belum tersedia. Taruh MP3 di{' '}
              <code className="rounded bg-muted px-1 text-xs">
                public/placement/audio/JepangKu Placement Test.mp3
              </code>{' '}
              — UI tetap bisa dicoba tanpa audio.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
