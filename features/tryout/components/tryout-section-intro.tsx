'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TryoutExamBlock } from '@/features/admin-cms/lib/tryout-exam-blocks';
import { TRYOUT_BLOCK_INSTRUCTIONS } from '@/features/tryout/lib/section-instructions';
import { cn } from '@/lib/utils';

type TryoutSectionIntroProps = {
  block: TryoutExamBlock;
  questionCount: number;
  sectionIndex: number;
  totalSections: number;
  onStart: () => void;
};

export function TryoutSectionIntro({
  block,
  questionCount,
  sectionIndex,
  totalSections,
  onStart,
}: TryoutSectionIntroProps) {
  const content = TRYOUT_BLOCK_INSTRUCTIONS[block.id];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Bagian {sectionIndex + 1} dari {totalSections}
        </p>
        <span
          className={cn(
            'mt-3 inline-block rounded-lg px-3 py-1 text-sm font-bold text-white',
            block.color,
          )}
        >
          {content.title}
        </span>
        <h1 className="mt-2 text-2xl font-extrabold text-foreground">{content.subtitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {questionCount} soal · {content.durationHint}
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Petunjuk Pengerjaan</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {content.instructions.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-primary">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-dashed border-border bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Contoh Soal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p
            className="whitespace-pre-line text-sm leading-relaxed text-foreground"
            style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
          >
            {content.example.prompt}
          </p>
          <div className="grid gap-2">
            {content.example.options.map((opt, index) => (
              <div
                key={opt}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                <span className="mr-2 font-bold text-muted-foreground">
                  {String.fromCharCode(65 + index)}.
                </span>
                {opt}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{content.example.note}</p>
        </CardContent>
      </Card>

      <Button type="button" size="lg" className="w-full gap-2" onClick={onStart}>
        Mulai bagian ini
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
