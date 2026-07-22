'use client';

import { useState } from 'react';
import { KanaAudioButton } from '@/features/kana/components/kana-audio-button';
import { KanaCharacterDialog } from '@/features/kana/components/kana-character-dialog';
import { VOWEL_HEADERS } from '@/features/kana/lib/kana-data';
import type { KanaCharacter, KanaChartSection } from '@/features/kana/lib/kana-types';

type KanaChartGridProps = {
  section: KanaChartSection;
};

export function KanaChartGrid({ section }: KanaChartGridProps) {
  const [selected, setSelected] = useState<KanaCharacter | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openCharacter = (character: KanaCharacter) => {
    setSelected(character);
    setDialogOpen(true);
  };

  return (
    <>
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
          {section.subtitle ? (
            <p className="text-sm text-muted-foreground">{section.subtitle}</p>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card p-3 sm:p-4">
          <div className="min-w-70">
            <div className="mb-2 grid grid-cols-5 gap-2">
              {VOWEL_HEADERS.map((vowel) => (
                <div
                  key={vowel}
                  className="text-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                >
                  {vowel}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {section.grid.map((row, rowIndex) => (
                <div key={`${section.id}-row-${rowIndex}`} className="grid grid-cols-5 gap-2">
                  {row.map((cell, colIndex) =>
                    cell ? (
                      <div
                        key={cell.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openCharacter(cell)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openCharacter(cell);
                          }
                        }}
                        className="group flex min-h-18 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background px-1 py-2 transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        <span className="whitespace-nowrap text-lg leading-none font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
                          {cell.char}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {cell.romaji}
                          </span>
                          <KanaAudioButton
                            src={cell.audioSrc}
                            label={cell.romaji}
                            size="sm"
                            className="size-6 opacity-70 group-hover:opacity-100"
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        key={`${section.id}-empty-${rowIndex}-${colIndex}`}
                        className="min-h-18 rounded-xl bg-transparent"
                        aria-hidden
                      />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <KanaCharacterDialog
        character={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectCharacter={setSelected}
      />
    </>
  );
}
