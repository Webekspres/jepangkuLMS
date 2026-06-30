'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markTryoutAudioPlayed } from '@/features/tryout/actions/tryout-exam-progress-actions';
import { resolveMediaUrl } from '@/lib/media/image-src';
import { cn } from '@/lib/utils';

type ChokaiAudioPlayerProps = {
    audioUrl: string;
    playKey: string;
    progressId: string;
    alreadyPlayed: boolean;
    label?: string;
    onPlayed?: (playKey: string) => void;
};

export function ChokaiAudioPlayer({
    audioUrl,
    playKey,
    progressId,
    alreadyPlayed,
    label = 'Putar audio',
    onPlayed,
}: ChokaiAudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>(alreadyPlayed ? 'done' : 'idle');

    useEffect(() => {
        if (alreadyPlayed) setPhase('done');
    }, [alreadyPlayed]);

    const resolvedUrl = resolveMediaUrl(audioUrl);

    async function handlePlay() {
        if (phase !== 'idle' || !audioRef.current || !resolvedUrl) return;

        const mark = await markTryoutAudioPlayed(progressId, playKey);
        if (!mark.ok) return;

        onPlayed?.(playKey);

        setPhase('playing');
        try {
            await audioRef.current.play();
        } catch {
            setPhase('done');
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
                    onEnded={() => setPhase('done')}
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
                <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
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
                    imageUrl: resolved ?? imageUrl,
                    sessionCode,
                    level,
                }),
            });
        } catch {
            /* ponytail: best-effort admin log */
        }
    }

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onSelect}
            className={cn(
                'flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all',
                selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30',
            )}
        >
            <div className="relative flex min-h-[100px] items-center justify-center bg-muted/30 p-2">
                <span className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-full bg-card text-xs font-bold shadow-sm">
                    {letter}
                </span>
                {resolved && !showFallback ? (
                    // eslint-disable-next-line @next/next/no-img-element -- R2 direct load
                    <img
                        src={resolved}
                        alt={fallbackText || `Opsi ${letter}`}
                        className="max-h-32 w-full object-contain"
                        onError={() => {
                            setShowFallback(true);
                            void reportError();
                        }}
                    />
                ) : (
                    <p
                        className="px-2 text-center text-sm leading-snug text-foreground"
                        style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
                    >
                        {fallbackText || `Opsi ${letter}`}
                    </p>
                )}
            </div>
        </button>
    );
}
