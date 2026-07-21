'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { KanaCharacter } from '@/features/kana/lib/kana-types';
import { cn } from '@/lib/utils';

type KanaStrokeStepsProps = {
  character: KanaCharacter;
};

export function KanaStrokeSteps({ character }: KanaStrokeStepsProps) {
  const [missingSteps, setMissingSteps] = useState<Set<number>>(new Set());

  const visibleSteps = character.strokeSteps
    .map((src, index) => ({ src, step: index + 1 }))
    .filter(({ step }) => !missingSteps.has(step));

  if (visibleSteps.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-3 text-center text-xs text-muted-foreground">
        Langkah penulisan segera hadir
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleSteps.map(({ src, step }) => (
        <div
          key={src}
          className="flex size-14 items-center justify-center rounded-xl border border-border bg-card p-1"
        >
          <Image
            src={src}
            alt={`Langkah ${step} menulis ${character.char}`}
            width={48}
            height={48}
            className="size-full object-contain"
            onError={() => {
              setMissingSteps((prev) => new Set(prev).add(step));
            }}
          />
        </div>
      ))}
    </div>
  );
}

type KanaStrokeAnimationProps = {
  character: KanaCharacter;
  className?: string;
};

export function KanaStrokeAnimation({ character, className }: KanaStrokeAnimationProps) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div
        className={cn(
          'flex aspect-square w-full max-w-[200px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-center text-xs text-muted-foreground',
          className,
        )}
      >
        Animasi penulisan segera hadir
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative aspect-square w-full max-w-[200px] overflow-hidden rounded-2xl border border-border bg-card',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={character.strokeGifSrc}
        alt={`Animasi menulis ${character.char}`}
        className="size-full object-contain p-2"
        onError={() => setMissing(true)}
      />
    </div>
  );
}
