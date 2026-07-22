'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markTryoutAudioPlayed } from '@/features/tryout/actions/tryout-exam-progress-actions';
import {
  bindTimestampSeekPlayback,
  resolveSeekWindow,
} from '@/features/tryout/lib/chokai-audio';
import { resolveMediaUrl } from '@/lib/media/image-src';
import { cn } from '@/lib/utils';

type ChokaiAudioPlayerProps = {
  audioUrl: string;
  playKey: string;
  progressId: string;
  alreadyPlayed: boolean;
  label?: string;
  /** Seek window on master audio (ms). */
  startMs?: number;
  endMs?: number | null;
  onPlayed?: (playKey: string) => void;
};

export function ChokaiAudioPlayer({
  audioUrl,
  playKey,
  progressId,
  alreadyPlayed,
  label = 'Putar audio',
  startMs = 0,
  endMs = null,
  onPlayed,
}: ChokaiAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [sessionPhase, setSessionPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const phase = alreadyPlayed ? 'done' : sessionPhase;

  const resolvedUrl = resolveMediaUrl(audioUrl);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    return bindTimestampSeekPlayback(el, { startMs, endMs }, () => {
      setSessionPhase('done');
    });
  }, [startMs, endMs, resolvedUrl]);

  async function handlePlay() {
    if (phase !== 'idle' || !audioRef.current || !resolvedUrl) return;

    const mark = await markTryoutAudioPlayed(progressId, playKey);
    if (!mark.ok) return;

    onPlayed?.(playKey);

    setSessionPhase('playing');
    try {
      const { startSec } = resolveSeekWindow(
        { startMs, endMs },
        audioRef.current.duration,
      );
      try {
        audioRef.current.currentTime = startSec;
      } catch {
        /* ignore */
      }
      await audioRef.current.play();
    } catch {
      setSessionPhase('done');
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      {resolvedUrl ? (
        <audio
          ref={audioRef}
          preload="auto"
          src={resolvedUrl}
          className="hidden"
          onEnded={() => setSessionPhase('done')}
        >
          <track kind="captions" />
        </audio>
      ) : null}

      {phase === 'idle' ? (
        <Button type="button" className="w-full gap-2" onClick={() => void handlePlay()}>
          <Volume2 className="size-4" />
          {label}
        </Button>
      ) : null}

      {phase === 'playing' ? (
        <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-emerald-800 ">
          <Loader2 className="size-4 animate-spin" />
          Sedang memutar…
        </div>
      ) : null}

      {phase === 'done' ? (
        <p className="text-center text-sm font-medium text-muted-foreground">Audio selesai</p>
      ) : null}
    </div>
  );
}

type ChokaiImageOptionProps = {
  optionId: string;
  letter: string;
  imageUrl: string | null;
  fallbackText: string;
  selected: boolean;
  disabled?: boolean;
  questionId: string;
  sessionCode: string;
  level: string;
  onSelect: () => void;
};

export function ChokaiImageOption({
  optionId,
  letter,
  imageUrl,
  fallbackText,
  selected,
  disabled,
  questionId,
  sessionCode,
  level,
  onSelect,
}: ChokaiImageOptionProps) {
  const [showFallback, setShowFallback] = useState(!imageUrl);
  const resolved = imageUrl ? resolveMediaUrl(imageUrl) : null;

  async function reportError() {
    try {
      await fetch('/api/tryout/report-media-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          questionId,
          optionId,
          sessionCode,
          level,
          imageUrl,
        }),
      });
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border-2 text-left transition',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/40',
        disabled && 'opacity-60',
      )}
    >
      <span className="bg-muted px-3 py-1 text-xs font-semibold">{letter}</span>
      {resolved && !showFallback ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt={fallbackText}
          className="aspect-video w-full object-contain bg-muted/40"
          onError={() => {
            setShowFallback(true);
            void reportError();
          }}
        />
      ) : (
        <span className="p-4 text-sm">{fallbackText}</span>
      )}
    </button>
  );
}

/** Shared Choukai scene image owned by ListeningStimulus. */
export function ChokaiStimulusImage({ imageUrl, alt }: { imageUrl: string; alt?: string }) {
  const resolved = resolveMediaUrl(imageUrl);
  if (!resolved) return null;
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-muted/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resolved} alt={alt ?? 'Ilustrasi listening'} className="mx-auto max-h-72 w-auto object-contain" />
    </div>
  );
}
