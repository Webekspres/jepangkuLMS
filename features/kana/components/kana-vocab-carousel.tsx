'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanaAudioButton } from '@/features/kana/components/kana-audio-button';
import { isKanaVocabFallbackImage } from '@/features/kana/lib/kana-vocab-images';
import type { KanaVocab } from '@/features/kana/lib/kana-types';
import { cn } from '@/lib/utils';

type KanaVocabCarouselProps = {
  items: KanaVocab[];
  className?: string;
};

export function KanaVocabCarousel({ items, className }: KanaVocabCarouselProps) {
  const [index, setIndex] = useState(0);
  const [imageMissing, setImageMissing] = useState(false);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-45 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground',
          className,
        )}
      >
        Contoh kosakata segera hadir
      </div>
    );
  }

  const item = items[index];
  const hasMultiple = items.length > 1;
  const showPlaceholder = imageMissing || isKanaVocabFallbackImage(item.imageSrc);

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-3', className)}>
      <p className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
        Vocabularies
      </p>

      <div className="flex items-stretch gap-2">
        {hasMultiple ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 self-center"
            onClick={() => {
              setImageMissing(false);
              setIndex((prev) => (prev - 1 + items.length) % items.length);
            }}
            aria-label="Kosakata sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Button>
        ) : null}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="relative mx-auto aspect-4/3 w-full max-w-35 overflow-hidden rounded-xl border border-border bg-muted/30">
            {showPlaceholder ? (
              <div className="flex size-full flex-col items-center justify-center gap-1 px-2 text-center">
                <p className="text-[10px] text-muted-foreground">Gambar belum tersedia</p>
                <p className="line-clamp-2 text-xs font-medium text-foreground/80">{item.meaning}</p>
              </div>
            ) : (
              <Image
                src={item.imageSrc}
                alt={item.meaning}
                fill
                className="object-cover"
                sizes="140px"
                onError={() => setImageMissing(true)}
              />
            )}
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 text-left">
              <p className="truncate text-base font-bold text-primary">{item.word}</p>
              <p className="text-xs italic text-primary/80">{item.reading}</p>
              <p className="text-xs text-muted-foreground">{item.meaning}</p>
            </div>
            <KanaAudioButton src={item.audioSrc} label={item.word} size="sm" />
          </div>
        </div>

        {hasMultiple ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 self-center"
            onClick={() => {
              setImageMissing(false);
              setIndex((prev) => (prev + 1) % items.length);
            }}
            aria-label="Kosakata berikutnya"
          >
            <ChevronRight className="size-4" />
          </Button>
        ) : null}
      </div>

      {hasMultiple ? (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          {index + 1} / {items.length}
        </p>
      ) : null}
    </div>
  );
}
