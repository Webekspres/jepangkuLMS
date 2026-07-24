'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChokaiMondaiInstruction } from '@/features/placement/data/chokai-mondai-instructions';

type PlacementMondaiIntroProps = {
  instruction: ChokaiMondaiInstruction;
  questionCount: number;
  onStart: () => void;
};

export function PlacementMondaiIntro({
  instruction,
  questionCount,
  onStart,
}: PlacementMondaiIntroProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">聴解</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-foreground sm:text-3xl">
          <span className="inline-block size-3 shrink-0 rounded-sm bg-brand-yellow" aria-hidden />
          <span style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}>
            {instruction.titleJp}
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {questionCount} soal · {instruction.hintId}
        </p>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Petunjuk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {instruction.instructionsJp.map((line) => (
            <p
              key={line}
              className="text-sm leading-relaxed text-foreground"
              style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
            >
              {line}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card className="border-dashed border-border bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
          >
            れい
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MondaiExamplePreview
            kind={instruction.exampleKind}
            imageUrl={instruction.exampleImageUrl}
          />
          <p className="text-xs text-muted-foreground">{instruction.exampleNote}</p>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-1">
        <Button size="lg" className="min-w-55 gap-2 font-bold" onClick={onStart}>
          Mulai {instruction.titleJp}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MondaiExamplePreview({
  kind,
  imageUrl,
}: {
  kind: ChokaiMondaiInstruction['exampleKind'];
  imageUrl?: string;
}) {
  if (kind === 'IMAGE_GRID') {
    if (imageUrl) {
      return (
        <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
          <Image
            src={imageUrl}
            alt="れい — contoh gambar mondai 1"
            width={480}
            height={360}
            className="mx-auto h-auto w-full max-w-md object-contain"
            unoptimized
          />
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => {
          const letter = String.fromCharCode(65 + i);
          return (
            <div
              key={letter}
              className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40"
            >
              <span className="text-2xl font-extrabold text-muted-foreground/50">{letter}</span>
              <span className="absolute top-1 left-1 rounded bg-muted px-1.5 text-[10px] font-bold">
                {letter}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (kind === 'TEXT_LIST') {
    const samples = ['としょかん', 'えき', 'デパート', 'レストラン'];
    return (
      <div className="grid gap-2">
        {samples.map((opt, i) => (
          <div
            key={opt}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
              {String.fromCharCode(65 + i)}
            </span>
            <span style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}>{opt}</span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === 'SCENE') {
    if (imageUrl) {
      return (
        <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
          <Image
            src={imageUrl}
            alt="れい — contoh gambar mondai 3"
            width={480}
            height={320}
            className="mx-auto h-auto w-full max-w-md object-contain"
            unoptimized
          />
        </div>
      );
    }
    return (
      <div className="mx-auto flex aspect-3/2 w-full max-w-md items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">Gambar scene (menyusul aset sensei)</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {['1', '2', '3'].map((n, i) => (
        <div
          key={n}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            {String.fromCharCode(65 + i)}
          </span>
          <span>{n}</span>
        </div>
      ))}
    </div>
  );
}
