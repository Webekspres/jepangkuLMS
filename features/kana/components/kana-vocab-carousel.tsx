'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanaHighlightedWord } from '@/features/kana/components/kana-highlighted-word';
import { isKanaVocabFallbackImage } from '@/features/kana/lib/kana-vocab-images';
import type { KanaVocab } from '@/features/kana/lib/kana-types';
import { cn } from '@/lib/utils';

type KanaVocabCarouselProps = {
  items: KanaVocab[];
  highlightChar: string;
  className?: string;
};

export function KanaVocabCarousel({ items, highlightChar, className }: KanaVocabCarouselProps) {
  const [index, setIndex] = useState(0);
  const [imageMissing, setImageMissing] = useState(false);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground',
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

  const goPrev = () => {
    setImageMissing(false);
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goNext = () => {
    setImageMissing(false);
    setIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-1">
        {hasMultiple ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={goPrev}
            aria-label="Kosakata sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Button>
        ) : null}

        <div className="aspect-square min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex h-full flex-col">
            <div className="relative min-h-0 flex-1 bg-muted/30">
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
                  sizes="200px"
                  onError={() => setImageMissing(true)}
                />
              )}
            </div>

            <div className="shrink-0 space-y-0.5 p-2 text-center">
              <KanaHighlightedWord
                word={item.word}
                highlightChar={highlightChar}
                className="text-center text-sm"
              />
              <p className="text-xs italic text-primary/80">{item.reading}</p>
              <p className="text-xs text-muted-foreground">{item.meaning}</p>
            </div>
          </div>
        </div>

        {hasMultiple ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={goNext}
            aria-label="Kosakata berikutnya"
          >
            <ChevronRight className="size-4" />
          </Button>
        ) : null}
      </div>

      {hasMultiple ? (
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          {index + 1} / {items.length}
        </p>
      ) : null}
    </div>
  );
}
