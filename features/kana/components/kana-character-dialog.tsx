'use client';

import { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KanaAudioButton } from '@/features/kana/components/kana-audio-button';
import { KanaStrokeAnimation, KanaStrokeSteps } from '@/features/kana/components/kana-stroke-steps';
import { KanaVocabCarousel } from '@/features/kana/components/kana-vocab-carousel';
import { getRowCharacters } from '@/features/kana/lib/kana-data';
import { stopKanaAudio } from '@/features/kana/lib/kana-audio';
import type { KanaCharacter } from '@/features/kana/lib/kana-types';
import { cn } from '@/lib/utils';

type KanaCharacterDialogProps = {
  character: KanaCharacter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCharacter: (character: KanaCharacter) => void;
};

export function KanaCharacterDialog({
  character,
  open,
  onOpenChange,
  onSelectCharacter,
}: KanaCharacterDialogProps) {
  const rowCharacters = useMemo(
    () => (character ? getRowCharacters(character.script, character.row) : []),
    [character],
  );

  useEffect(() => {
    if (!open) stopKanaAudio();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,44rem)] overflow-y-auto sm:max-w-3xl">
        {character ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>
                {character.char} — {character.romaji}
              </DialogTitle>
              <DialogDescription>Detail karakter {character.script}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <p className="text-6xl font-bold leading-none text-foreground">{character.char}</p>
                  <div className="pb-1">
                    <p className="text-lg font-semibold text-primary">{character.romaji}</p>
                    <KanaAudioButton src={character.audioSrc} label={character.romaji} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Langkah menulis
                  </p>
                  <KanaStrokeSteps character={character} />
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Animasi
                </p>
                <KanaStrokeAnimation character={character} />
              </div>

              <KanaVocabCarousel items={character.vocabularies} />
            </div>

            {rowCharacters.length > 1 ? (
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Baris yang sama
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {rowCharacters.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectCharacter(item)}
                      className={cn(
                        'flex size-12 flex-col items-center justify-center rounded-xl border text-sm font-bold transition-colors',
                        item.id === character.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground hover:border-primary/40',
                      )}
                    >
                      {item.char}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
